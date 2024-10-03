import { peaqDidResolver } from '../src/index';

const BASE_URL = 'wss://wsspc1-qa.agung.peaq.network';


describe('Did', () => {
    it('Generic resolve', async () => {
        const resolver = new peaqDidResolver();
        const result = await resolver.resolve({baseUrl: BASE_URL, name: 'myDID_123', address: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg'});
        console.log(result);

        expect(result).toBeDefined();
        expect(result?.document).toBeDefined();
        });
    it('Resolve DID Document', async () => {
        const resolver = new peaqDidResolver();
        const result = await resolver.resolve_document({baseUrl: BASE_URL, name: 'myDID_123', address: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg'});
        console.log(result)
        });

    it('Resolve services', async () => {
        const resolver = new peaqDidResolver();
        const result = await resolver.resolve_services({baseUrl: BASE_URL, name: 'myDID_123', address: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg'});
        console.log(result)
        expect(result).toBeDefined();
        });

    it('Resolve verifications', async () => {
        const resolver = new peaqDidResolver();
        const result = await resolver.resolve_verifications({baseUrl: BASE_URL, name: 'myDID_123', address: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg'});
        console.log(result)
        expect(result).toBeDefined();

        });

    it('Resolve authentications', async () => {
        const resolver = new peaqDidResolver();
        const result = await resolver.resolve_authentications({baseUrl: BASE_URL, name: 'myDID_123', address: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg'});
        console.log(result)
        expect(result).toBeDefined();
        });
    it('Resolve signature', async () => {
        const resolver = new peaqDidResolver();
        const result = await resolver.resolve_signature({baseUrl: BASE_URL, name: 'myDID_123', address: '5Df42mkztLtkksgQuLy4YV6hmhzdjYvDknoxHv1QBkaY12Pg'});
        console.log(result)
        });
    }
)