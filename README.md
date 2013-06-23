#eashl-stat-tracker
=====

EA doesn't do a detailed job of keeping track of player stats, so here's something that will hopefully help out a bit.

## Install

### Setting up NodeJS

    git clone https://github.com/devinmcinnis/eashl.git
    cd eashl
    npm install
    npm install foreman -g

### Setting up PostgreSQL on Linux
    sudo apt-get postgresql
    sudo su postgres
    psql
    postgres=# CREATE USER eashl WITH PASSWORD 'eashl';
    postgres=# CREATE DATABASE eashl OWNER eashl;
    ALTER USER eashl WITH SUPERUSER;
    /q;

## Running App

    foreman start -f Procfile-dev

Currently, everything takes place in the console and may take a minute to start firing events.
