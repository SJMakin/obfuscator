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
  apt-get install -y --no-install-recommends ca-certificates curl unzip; \
  rm -rf /var/lib/apt/lists/*

# Install Tigress 4.0.11 from the working download URL
ENV TIGRESS_VERSION=4.0.11
RUN set -eux; \
  url="http://tigress.cs.arizona.edu/cgi-bin/projects/tigress/download.cgi?file=tigress_${TIGRESS_VERSION}-1_all.deb.zip"; \
  curl -fsSL "$url" -o /tmp/tigress.zip; \
  cd /tmp; \
  unzip tigress.zip; \
  dpkg -i tigress_${TIGRESS_VERSION}-1_all.deb || true; \
  apt-get install -f -y; \
  rm -rf /tmp/tigress*

RUN emcc -v && tigress --help | head -n 5

WORKDIR /work