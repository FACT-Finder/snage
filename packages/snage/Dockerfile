FROM node:14.0.0-alpine
WORKDIR /snage
COPY build/snage.js /snage
COPY build/ui /snage/ui
RUN chmod +x /snage/snage.js
EXPOSE 8081
ENTRYPOINT ["/snage/snage.js"]
