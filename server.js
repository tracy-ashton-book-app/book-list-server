client.connect();
client.on('error', err => console.error(err));

app.use(cors());

app.get('/', (req, res) => res.send('Testing 1, 2, 3'));

app.get('*', (res, req) => res.status(403).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));