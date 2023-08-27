const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

let history = [];

fs.readFile('history.json', 'utf8', (err, data) => {
    if (!err) {
        history = JSON.parse(data);
    }
});

app.get('/', (req, res) => {
    res.send(`
        <h1>Math Operations Server</h1>
        <p>Sample endpoint:</p>
        <p><a href="/5/plus/3/minus/2">/5/plus/3/minus/2</a></p>
        <p><a href="/5/plus/3/plus/2">/5/plus/3/plus/2</a></p>
    <p><a href="/10/into/2/by/5">/10/into/2/by/5</a></p>
    <p><a href="/20/minus/8/plus/5/into/2">/20/minus/8/plus/5/into/2</a></p>
    `);
});

app.get('/history', (req, res) => {
    res.json(history);
});

app.get('/:expression*', (req, res) => {

    const expression = req.params.expression + req.params[0];
    const parts = expression.split('/');
    let resString = parts[0];
    if (expression === 'favicon.ico') {
        return res.status(204).end();
    }
    for (let i = 1; i < parts.length; i += 2) {
        const operator = parts[i];
        const number = parseFloat(parts[i + 1]);

        if (isNaN(number)) {
            return res.status(400).json({ error: 'Invalid number' });
        }

        if (operator === 'plus') {
            resString = resString.concat('+', number.toString(), '');
        } else if (operator === 'minus') {
            resString = resString.concat('-', number.toString(), '');
        } else if (operator === 'into') {
            resString = resString.concat('*', number.toString(), '');
        } else if (operator === 'by') {
            resString = resString.concat('/', number.toString(), '');
        } else {
            return res.status(400).json({ error: 'Invalid operator' });
        }
    }

    if (parts.length % 2 === 0) {
        return res.status(400).json({ error: 'Invalid expression' });
    }

    const precedence = { 'plus': 1, 'minus': 1, 'into': 2, 'by': 2 };
    const outputQueue = [];
    const operatorStack = [];

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            outputQueue.push(parseFloat(parts[i]));
        } else {
            const token = parts[i];
            while (
                operatorStack.length > 0 &&
                precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
            ) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        }
    }

    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }

    const evaluationStack = [];
    for (const token of outputQueue) {
        if (typeof token === 'number') {
            evaluationStack.push(token);
        } else {
            const b = evaluationStack.pop();
            const a = evaluationStack.pop();
            switch (token) {
                case 'plus':
                    evaluationStack.push(a + b);
                    break;
                case 'minus':
                    evaluationStack.push(a - b);
                    break;
                case 'into':
                    evaluationStack.push(a * b);
                    break;
                case 'by':
                    evaluationStack.push(a / b);
                    break;
            }
        }
    }
    console.log(resString);

    const result = evaluationStack[0];


    const operation = {
        expression: resString,
        result: result
    };

    history.push(operation);
    if (history.length > 20) {
        history.shift();
    }
    fs.writeFile('history.json', JSON.stringify(history), 'utf8', (err) => {
        if (err) {
            console.error('Error saving history:', err);
        }
    });

    res.json(operation);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});