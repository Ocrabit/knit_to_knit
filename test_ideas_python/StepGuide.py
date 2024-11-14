from turtle import TurtleGraphicsError
from xmlrpc.client import boolean

import numpy as np

COLOR_MAPPING = {
    0: '#00000000',
    1: '#ffffff',
    2: '#000000',
    3: '#d722c5',
}


class Square:
    def __init__(self, color, stitch_type):
        self.square = {
            'color': color,
            'stitch_type': stitch_type,
            'stitch_shift': boolean,
            'chunk': int,
        }

    def __str__(self):
        #return f"Color: {self.square['color']}, Stitch Type: {self.square['stitch_type']}"
        return f'{self.square['chunk']}'


def run_test():
    gridData = np.load('test_resources/test_torso.npy', allow_pickle=True).item()
    shapeData = gridData['shape']
    colorData = gridData['color']
    stitchData = gridData['stitch_type']

    stepGuide_arr = []
    previous_row = []
    chunk_trace = None
    chunk_index = 0

    previous_stitch = []
    print('row debuging')
    for i, row in enumerate(gridData['shape']):
        print(stitchData[i])
        if i < 10:
            stepGuide_row = []
            for j, col in enumerate(row):
                square = square = {
                    'color': COLOR_MAPPING[colorData[i][j]],
                    'stitch_type': stitchData[i][j],
                    'stitch_shift': [],
                    'chunk': int,
                }

                if chunk_trace is None:
                    chunk_trace = stitchData[i][j]
                    square['chunk'] = chunk_index
                else:
                    if chunk_trace != stitchData[i][j]:
                        chunk_trace = stitchData[i][j]
                        chunk_index += 1
                        square['chunk'] = chunk_index
                    else:
                        square['chunk'] = chunk_index

                if previous_row and previous_row[j] != col:
                    print('previous row[j] and col', previous_row[j], col)
                    square['stitch_shift'] = [True]
                else:
                    square['stitch_shift'] = [False]

                stepGuide_row.append(square)
            stepGuide_arr.append(stepGuide_row)
            previous_row = row.copy()
            # clear chunk trace and index
            chunk_trace = None
            chunk_index = 0

    for i, row in enumerate(stepGuide_arr):
        print(f'row: {i}')
        for square in row:
            print(square['chunk'], end=' ')
        print()

    for i, row in enumerate(stepGuide_arr):
        print(f'row: {i}')
        for square in row:
            print(square['stitch_shift'], end=' ')
        print()

    print('square 1', stepGuide_arr[0][0])
    math_sum = 0
    for val in stepGuide_arr[3]:
        if val['stitch_shift'] == [True]:
            math_sum += 1
    print(f'math sum: {math_sum}')


def build_test_arr():
    shape_arr = [
        [0, 0, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 0, 0, 0],
    ]
    color_arr = [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
        [1, 0, 0, 0, 1],
    ]
    stitch_type_arr = [
        [1, 1, 0, 0, 1],
        [1, 1, 1, 0, 0],
        [1, 1, 1, 0, 1],
        [1, 0, 1, 0, 1],
        [0, 0, 1, 1, 1],
        [0, 0, 1, 0, 1],
        [0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
    ]
    test_torso_data = {
        'shape': shape_arr,
        'color': color_arr,
        'stitch_type': stitch_type_arr,
    }

    np.save('test_resources/test_torso.npy', test_torso_data, allow_pickle=True)


if '__main__' == __name__:
    run_test()
    #build_test_arr()
