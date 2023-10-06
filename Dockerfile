FROM python:3.10

# The enviroment variable ensures that the python output is set straight
# to the terminal with out buffering it first
ENV PYTHONUNBUFFERED 1

# create root directory for our project in the container
RUN mkdir /FlooChat

# Set the working directory to /music_service
WORKDIR /FlooChat

# Copy the current directory contents into the container at /music_service
ADD . /FlooChat/

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y netcat-openbsd gcc && \
    apt-get clean

# Install any needed packages specified in requirements.txt

RUN pip install -r requirements.txt


