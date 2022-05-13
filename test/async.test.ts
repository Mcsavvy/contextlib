import {Use} from '../src/async'

describe('Use', () => {
    test('success', async () => {
        const out: any[] = []
        for await (const v of Use({
            enter: function () {
                expect(arguments).toHaveLength(0)
                out.push(1)
                return 2
            },
            exit: function () {
                expect(arguments).toHaveLength(0)
                out.push(3)
            }
        })) {
            expect(v).toStrictEqual(2)
            out.push(4)
        }
        out.push(5)
        expect(out).toStrictEqual([
            1,
            4,
            3,
            5
        ])
    })
    test('success with async', async () => {
        const out: any[] = []
        for await (const v of Use({
            enter: async function () {
                expect(arguments).toHaveLength(0)
                out.push(1)
                await new Promise((resolve) => setTimeout(resolve, 50))
                return 2
            },
            exit: async function () {
                expect(arguments).toHaveLength(0)
                out.push(3)
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        })) {
            expect(v).toStrictEqual(2)
            out.push(4)
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
        out.push(5)
        expect(out).toStrictEqual([
            1,
            4,
            3,
            5
        ])
    })
})
