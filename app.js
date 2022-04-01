const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send({ message: 'Hello world' });
});

app.listen(8000, () =>
  console.log('server is listening on http://localhost:8000')
);
