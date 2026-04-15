export function simplifySplice(...stages) {
  let neg = false;
  let begin = 0;
  const ranges = [];
  if (typeof stages[0]?.[0] === 'string') {
    ranges.push(stages[0][0]);
    begin = 1;
  }
  const needsCopy = new Set();
  for (const l of stages) {
    for (const stage of l) {
      if (typeof stage !== 'string' && (stage.length > 2 || stage[1])) {
        const pos = stage[0];
        const curNeg = pos < 0;
        if (curNeg !== neg) {
          begin = ranges.length;
          neg = curNeg;
        }
        const p1 = findFirstIndexBin(ranges, (r) => pos <= r[0] + r.length - 2, begin);
        if (p1 === ranges.length) {
          needsCopy.add(stage);
          ranges.push(stage);
        } else {
          const end = pos + stage[1];
          const p2 = findFirstIndexBin(ranges, (r) => r[0] > end, p1);
          const shift = stage.length - 2 - stage[1];
          if (shift) {
            for (let i = p2; i < ranges.length; ++i) {
              let r = ranges[i];
              if (needsCopy.has(r)) {
                ranges[i] = r = [...r];
              }
              r[0] += shift;
            }
          }
          if (p2 === p1) {
            ranges.splice(p1, 0, stage);
          } else {
            let merged = ranges[p1];
            if (needsCopy.has(merged)) {
              merged = [...merged];
            }
            mergeSplice(merged, stage, 0);
            for (let i = p1 + 1; i < p2; ++i) {
              mergeSplice(merged, ranges[i], shift);
            }
            if (merged.length > 2 || merged[1]) {
              ranges.splice(p1, p2 - p1, merged);
            } else {
              ranges.splice(p1, p2 - p1);
            }
          }
        }
      }
    }
  }
  return ranges;
}

function findFirstIndexBin(l, pred, p1 = 0, p2 = l.length) {
  if (p2 > p1 && !pred(l[p2 - 1])) {
    // optimisation: if simplifySplice list is already ordered, traverse it in O(n) instead of O(n log(n))
    return p2;
  } else {
    --p2;
  }
  while (p2 > p1) {
    const p = (p1 + p2) >>> 1;
    if (pred(l[p])) {
      p2 = p;
    } else {
      p1 = p + 1;
    }
  }
  return p1;
}

function mergeSplice(firstInOut, second, shiftSecond) {
  const offset = second[0] + shiftSecond - firstInOut[0];
  const posOffset = Math.max(offset, 0);
  const del = Math.max(Math.min(second[1] + offset, firstInOut.length - 2) - posOffset, 0);
  firstInOut.splice(2 + posOffset, del, ...second.slice(2));
  firstInOut[0] = Math.min(firstInOut[0], second[0]);
  firstInOut[1] += second[1] - del;
}
