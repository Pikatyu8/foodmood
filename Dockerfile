FROM python:3.10-slim

WORKDIR /code

# Установка зависимостей
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Копируем файлы бэкенда в контейнер
COPY . /code

# Hugging Face по умолчанию ожидает, что приложение будет слушать порт 7860
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "7860"]