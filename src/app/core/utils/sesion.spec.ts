import { tokenVigente } from './sesion';

/** Arma un JWT con el payload dado; la firma no importa aquí. */
function token(payload: object): string {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.firma`;
}

describe('tokenVigente', () => {
    const ahora = Date.UTC(2026, 9, 21, 12, 0, 0);
    const segundos = ahora / 1000;

    it('acepta un token que vence más adelante', () => {
        expect(tokenVigente(token({ sub: 'x', exp: segundos + 3600, role: 'admin' }), ahora)).toBeTrue();
    });

    it('rechaza un token vencido, que es lo que dejaba el panel vacío', () => {
        expect(tokenVigente(token({ sub: 'x', exp: segundos - 1, role: 'admin' }), ahora)).toBeFalse();
    });

    it('rechaza lo que no se puede leer', () => {
        expect(tokenVigente(null, ahora)).toBeFalse();
        expect(tokenVigente('', ahora)).toBeFalse();
        expect(tokenVigente('no-es-un-jwt', ahora)).toBeFalse();
        expect(tokenVigente('a.@@@.c', ahora)).toBeFalse();
        expect(tokenVigente(token({ sub: 'x' }), ahora)).toBeFalse();
    });
});
