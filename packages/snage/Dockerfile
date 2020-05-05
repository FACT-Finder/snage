FROM node:14.0.0-alpine
RUN apk add --no-cache git
WORKDIR /snage
COPY build/snage.js /snage
COPY build/ui /snage/ui
RUN chmod +x /snage/snage.js
EXPOSE 8080
ENTRYPOINT ["/snage/snage.js"]
