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
  apt-get install -y --no-install-recommends ca-certificates curl xz-utils tar make git python; \
  rm -rf /var/lib/apt/lists/*

ENV TIGRESS_VERSION=3.3
RUN set -eux; \
  url1="https://tigress.wtf/files/tigress-${TIGRESS_VERSION}-linux-x86_64.tar.xz"; \
  url2="https://tigress.wtf/files/tigress-${TIGRESS_VERSION}-linux-x86_64.tar.gz"; \
  mkdir -p /opt/tigress; \
  if curl -fsSL "$url1" -o /tmp/tigress.tar.xz; then \
    tar -C /opt/tigress --strip-components=1 -xJf /tmp/tigress.tar.xz; \
  else \
    curl -fsSL "$url2" -o /tmp/tigress.tar.gz; \
    tar -C /opt/tigress --strip-components=1 -xzf /tmp/tigress.tar.gz; \
  fi; \
  ln -sf /opt/tigress/tigress /usr/local/bin/tigress

RUN emcc -v && tigress --help | head -n 5

WORKDIR /work