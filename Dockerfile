FROM node:14.5-alpine

COPY . .

RUN npm install

CMD ["npm", "start"]