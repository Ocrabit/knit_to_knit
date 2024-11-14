const fs = require('fs');

// Color mapping similar to the Python dictionary
const COLOR_MAPPING = {
    0: '#00000000',
    1: '#ffffff',
    2: '#000000',
    3: '#d722c5'
};

function loadTestData() {
    const data = JSON.parse(fs.readFileSync('test_resources/test_torso.json', 'utf8'));
    return {
        shape: data.shape,
        color: data.color,
        stitch_type: data.stitch_type
    };
}

// Main function to run the test
function runTest() {
    const gridData = loadTestData();
    const shapeData = gridData.shape;
    const colorData = gridData.color;
    const stitchData = gridData.stitch_type;

    let stepGuideArr = [];
    let previousRow = [];
    let chunkTrace = null;
    let chunkIndex = 0;

    console.log('Row debugging');
    for (let i = 0; i < shapeData.length; i++) {
        console.log(stitchData[i]);

        if (i < 10) {
            let stepGuideRow = [];
            for (let j = 0; j < shapeData[i].length; j++) {
                let square = {
                    color: COLOR_MAPPING[colorData[i][j]],
                    stitch_type: stitchData[i][j],
                    stitch_shift: [],
                    chunk: 0
                };

                if (chunkTrace === null) {
                    chunkTrace = stitchData[i][j];
                    square.chunk = chunkIndex;
                } else {
                    if (chunkTrace !== stitchData[i][j]) {
                        chunkTrace = stitchData[i][j];
                        chunkIndex += 1;
                        square.chunk = chunkIndex;
                    } else {
                        square.chunk = chunkIndex;
                    }
                }

                if (previousRow.length > 0 && previousRow[j] !== shapeData[i][j]) {
                    square.stitch_shift = [true];
                } else {
                    square.stitch_shift = [false];
                }

                stepGuideRow.push(square);
            }
            stepGuideArr.push(stepGuideRow);
            previousRow = shapeData[i].slice();
            chunkTrace = null;
            chunkIndex = 0;
        }
    }

    // Printing the chunk and stitch_shift for debugging
    stepGuideArr.forEach((row, i) => {
        console.log(`Row: ${i}`);
        row.forEach(square => process.stdout.write(`${square.chunk} `));
        console.log();
    });

    stepGuideArr.forEach((row, i) => {
        console.log(`Row: ${i}`);
        row.forEach(square => process.stdout.write(`${square.stitch_shift} `));
        console.log();
    });

    console.log('Square 1', stepGuideArr[0][0]);

    let mathSum = stepGuideArr[3].reduce((sum, val) => {
        return sum + (val.stitch_shift[0] ? 1 : 0);
    }, 0);

    console.log(`Math sum: ${mathSum}`);
}

runTest();