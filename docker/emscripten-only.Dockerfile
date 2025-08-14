FROM trzeci/emscripten:sdk-tag-1.38.45-64bit

SHELL ["/bin/bash", "-lc"]

# Use archived Debian Stretch repo only (drop stretch-updates and security which 404),
# and disable validity checks for archived metadata.
RUN set -eux; \
  printf '%s\n' \
    'deb http://archive.debian.org/debian stretch main contrib non-free' \
    > /etc/apt/sources.list; \
  echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until; \
  apt-get -o Acquire::Check-Valid-Until=false update; \
  apt-get install -y --no-install-recommends ca-certificates curl; \
  rm -rf /var/lib/apt/lists/*

RUN emcc -v

WORKDIR /work