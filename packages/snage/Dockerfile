FROM node:18.4.0-alpine
RUN apk add --no-cache git
WORKDIR /snage
COPY build/npm/snage.js /snage
COPY build/npm/ui /snage/ui
RUN chmod +x /snage/snage.js
EXPOSE 8080
ENTRYPOINT ["/snage/snage.js"]
