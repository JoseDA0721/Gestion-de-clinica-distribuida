FROM postgres:17

# Paso 1: instalar dependencias base
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    wget \
    lsb-release \
    software-properties-common

# Paso 2: añadir repositorio de Microsoft para ODBC
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list

# Paso 3: añadir repositorio oficial de PostgreSQL (para pglogical)
RUN echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

# Paso 4: instalar ODBC de SQL Server
RUN apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 mssql-tools18

# Paso 5: instalar herramientas necesarias
RUN apt-get update && \
    apt-get install -y \
        unixodbc-dev \
        freetds-dev \
        gcc \
        make \
        git \
        postgresql-server-dev-17 \
        postgresql-common \
        libjson-c-dev \
        libreadline-dev \
        zlib1g-dev \
        flex \
        bison \
        libssl-dev \
        libkrb5-dev \
        libselinux1-dev \
        libzstd-dev \
        liblz4-dev \
        libxslt1-dev \
        libpam0g-dev

# Paso 6: clonar y compilar tds_fdw
RUN git clone https://github.com/tds-fdw/tds_fdw.git && \
    cd tds_fdw && make && make install

# Paso 7: instalar pglogical desde APT (ya no lo compilas)
RUN apt-get update && apt-get install -y postgresql-17-pglogical

# Paso 8: limpieza
RUN apt-get remove -y gcc make git && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /tds_fdw /pglogical
