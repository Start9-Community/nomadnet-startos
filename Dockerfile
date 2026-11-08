FROM python:3.12-slim-trixie

ARG NOMADNET_VERSION=1.5.0
ARG TTYD_VERSION=1.7.7
ARG TTYD_SHA256_X86_64=8a217c968aba172e0dbf3f34447218dc015bc4d5e59bf51db2f2cd12b7be4f55
ARG TTYD_SHA256_AARCH64=b38acadd89d1d396a0f5649aa52c539edbad07f4bc7348b27b4f4b7219dd4165
ARG TARGETARCH

RUN apt-get update \
 && apt-get install -y --no-install-recommends tmux nano procps curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN case "$TARGETARCH" in \
      amd64) arch=x86_64;  sum="$TTYD_SHA256_X86_64" ;; \
      arm64) arch=aarch64; sum="$TTYD_SHA256_AARCH64" ;; \
      *) echo "unsupported arch: $TARGETARCH" >&2; exit 1 ;; \
    esac \
 && curl -fsSL -o /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${arch}" \
 && echo "${sum}  /usr/local/bin/ttyd" | sha256sum -c - \
 && chmod +x /usr/local/bin/ttyd

RUN pip install --no-cache-dir "nomadnet==${NOMADNET_VERSION}"

COPY docker/tmux.conf /etc/tmux.conf
COPY docker/nomadnet-session.sh /usr/local/bin/nomadnet-session
RUN chmod +x /usr/local/bin/nomadnet-session

# Both ~/.reticulum and ~/.nomadnetwork (and ~/Downloads) resolve into the volume.
ENV HOME=/data \
    PYTHONUNBUFFERED=1 \
    TERM=xterm-256color \
    LANG=C.UTF-8

WORKDIR /data
