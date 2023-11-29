import express from 'express';
import appRouter from './routers/app.js';
import './db.js';

const app = express();

app.use('/api', appRouter);

app.listen(5000, () => {
    console.log('App listening on 5000');
});