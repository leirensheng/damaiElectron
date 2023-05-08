import {createHash} from 'crypto';

export function sha256sum(data) {
  return createHash('sha256').update(data).digest('hex');
}
