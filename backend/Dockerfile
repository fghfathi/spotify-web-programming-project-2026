# Django REST backend.
#
# Runs gunicorn rather than `manage.py runserver`, serves Django admin's static
# files through WhiteNoise, and talks to the Postgres service via DATABASE_URL.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# curl is used by the compose healthcheck. psycopg2-binary and Pillow both ship
# manylinux wheels, so no compiler toolchain is needed.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect the admin's CSS/JS so WhiteNoise can serve them with DEBUG off.
RUN python manage.py collectstatic --noinput

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "60", \
     "--access-logfile", "-"]
