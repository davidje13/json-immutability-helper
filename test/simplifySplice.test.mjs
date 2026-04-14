import { simplifySplice } from '../src/combine.mjs';

describe('simplifySplice', () => {
  it('removes no-op steps', () => {
    const steps = simplifySplice([
      [0, 0],
      [1, 2],
      [4, 0],
    ]);
    expect(steps).equals([[1, 2]]);
  });

  it('combines multiple arguments', () => {
    const steps = simplifySplice(
      [
        [0, 1],
        [2, 1],
      ],
      [[4, 1]],
    );
    expect(steps).equals([
      [0, 1],
      [2, 1],
      [4, 1],
    ]);
  });

  it('preserves operation ID of first argument if given', () => {
    const steps = simplifySplice(['splice', [0, 1], [2, 1]], [[4, 1]]);
    expect(steps).equals(['splice', [0, 1], [2, 1], [4, 1]]);
  });

  it('ignores operation ID of subsequent arguments', () => {
    const steps = simplifySplice(
      [
        [0, 1],
        [2, 1],
      ],
      ['splice', [4, 1]],
    );
    expect(steps).equals([
      [0, 1],
      [2, 1],
      [4, 1],
    ]);
  });

  it('merges consecutive deletion steps', () => {
    const steps = simplifySplice([
      [1, 2],
      [1, 3],
    ]);
    expect(steps).equals([[1, 5]]);
  });

  it('merges reversed consecutive deletion steps', () => {
    const steps = simplifySplice([
      [4, 2],
      [1, 3],
    ]);
    expect(steps).equals([[1, 5]]);
  });

  it('merges multiple consecutive deletion steps', () => {
    const steps = simplifySplice([
      [1, 2],
      [2, 3],
      [1, 1],
    ]);
    expect(steps).equals([[1, 6]]);
  });

  it('merges overlapping deletion steps', () => {
    const steps = simplifySplice([
      [2, 2],
      [1, 3],
    ]);
    expect(steps).equals([[1, 5]]);
  });

  it('merges consecutive addition steps', () => {
    const steps = simplifySplice([
      [1, 0, 'A', 'B'],
      [3, 0, 'C', 'D'],
    ]);
    expect(steps).equals([[1, 0, 'A', 'B', 'C', 'D']]);
  });

  it('merges reversed consecutive addition steps', () => {
    const steps = simplifySplice([
      [1, 0, 'A', 'B'],
      [1, 0, 'C', 'D'],
    ]);
    expect(steps).equals([[1, 0, 'C', 'D', 'A', 'B']]);
  });

  it('merges overlapping consecutive addition steps', () => {
    const steps = simplifySplice([
      [1, 0, 'A', 'B'],
      [2, 0, 'C', 'D'],
    ]);
    expect(steps).equals([[1, 0, 'A', 'C', 'D', 'B']]);
  });

  it('merges consecutive replacement steps', () => {
    const steps = simplifySplice([
      [1, 1, 'A'],
      [1, 1, 'B'],
      [1, 1, 'C'],
    ]);
    expect(steps).equals([[1, 1, 'C']]);
  });

  it('maintains untouched replacement parts', () => {
    const steps = simplifySplice([
      [1, 1, 'A', 'B', 'C'],
      [1, 1, 'D', 'E'],
      [1, 1, 'F'],
    ]);
    expect(steps).equals([[1, 1, 'F', 'E', 'B', 'C']]);
  });

  it('merges multiple touching replacement steps', () => {
    const steps = simplifySplice([
      [0, 1, 'A'],
      [2, 1, 'Z'],
      [1, 1, 'B', 'C', 'D'],
    ]);
    expect(steps).equals([[0, 3, 'A', 'B', 'C', 'D', 'Z']]);
  });

  it('merges deletion followed by addition', () => {
    const steps = simplifySplice([
      [1, 1],
      [1, 0, 'A'],
    ]);
    expect(steps).equals([[1, 1, 'A']]);
  });

  it('merges addition followed by deletion', () => {
    const steps = simplifySplice([
      [1, 0, 'A'],
      [1, 1],
    ]);
    expect(steps).equals([]);
  });

  it('merges complex step sequences', () => {
    const steps = simplifySplice([
      [1, 0, 'A', 'B'],
      [1, 1, 'C'],
      [2, 1, 'D'],
      [2, 4, 'E', 'F'],
    ]);
    expect(steps).equals([[1, 3, 'C', 'E', 'F']]);
  });

  it('does not modify the input', () => {
    const source = [
      [1, 0, 'A', 'B'],
      [1, 1, 'C'],
      [2, 1, 'D'],
      [2, 4, 'E', 'F'],
    ];
    const input = source.map((v) => [...v]);
    simplifySplice(input);
    expect(input).equals(source);
  });

  it('merges interrupted consecutive deletion steps and repositions later ranges', () => {
    const steps = simplifySplice([
      [1, 2],
      [10, 1],
      [1, 3],
    ]);
    expect(steps).equals([
      [1, 5],
      [7, 1],
    ]);
  });

  it('does not merge non-overlapping deletion steps', () => {
    const steps = simplifySplice([
      [1, 2],
      [2, 3],
    ]);
    expect(steps).equals([
      [1, 2],
      [2, 3],
    ]);
  });

  it('does not merge non-overlapping addition steps', () => {
    const steps = simplifySplice([
      [1, 0, 'A'],
      [3, 0, 'B'],
    ]);
    expect(steps).equals([
      [1, 0, 'A'],
      [3, 0, 'B'],
    ]);
  });

  it('reorders but does not merge non-overlapping reversed deletion steps', () => {
    const steps = simplifySplice([
      [4, 2],
      [1, 2],
    ]);
    expect(steps).equals([
      [1, 2],
      [2, 2],
    ]);
  });

  it('reorders but does not merge non-overlapping reversed addition steps', () => {
    const steps = simplifySplice([
      [2, 0, 'B'],
      [1, 0, 'A'],
    ]);
    expect(steps).equals([
      [1, 0, 'A'],
      [3, 0, 'B'],
    ]);
  });

  it('does not reorder or merge past negative indices', () => {
    const steps = simplifySplice([
      [4, 2],
      [-1, 1],
      [1, 2],
      [4, 1],
    ]);
    expect(steps).equals([
      [4, 2],
      [-1, 1],
      [1, 2],
      [4, 1],
    ]);
  });
});
