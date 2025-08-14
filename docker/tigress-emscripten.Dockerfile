FROM trzeci/emscripten:sdk-tag-1.38.45-64bit

SHELL ["/bin/bash", "-lc"]

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl xz-utils tar make git python \
  && rm -rf /var/lib/apt/lists/*

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