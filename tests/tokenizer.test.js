import { tokenize } from '../src/tokenizer.js';

// Utility function to add End token to expected results
function withEnd(tokens, endOriginal = '') {
    return [...tokens, { type: 'End', original: endOriginal, value: null }];
}

describe('Math Oracle Tokenizer', () => {
    describe('Basic tokenization', () => {
        test('simple tokenization includes End token', () => {
            const tokens = tokenize('x');
            expect(tokens[tokens.length - 1]).toEqual({ type: 'End', original: '', value: null });
        });

        test('whitespace only returns End token', () => {
            expect(tokenize('   \t\n  ')).toEqual([
                { type: 'End', original: '   \t\n  ', value: null }
            ]);
        });

        test('empty string returns End token', () => {
            expect(tokenize('')).toEqual([
                { type: 'End', original: '', value: null }
            ]);
        });

        test('concatenating originals reconstructs input', () => {
            const input = 'x + 2.5 * "hello" / 3';
            const tokens = tokenize(input);
            const reconstructed = tokens.map(t => t.original).join('');
            expect(reconstructed).toBe(input);
        });
    });

    describe('Identifier tokens', () => {
        test('simple identifiers', () => {
            const tokens = tokenize('x y α β');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'x', value: 'x', kind: 'User' },
                { type: 'Identifier', original: ' y', value: 'y', kind: 'User' },
                { type: 'Identifier', original: ' α', value: 'α', kind: 'User' },
                { type: 'Identifier', original: ' β', value: 'β', kind: 'User' }
            ]));
        });

        test('identifiers with numbers', () => {
            const tokens = tokenize('x2 y123 var1');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'x2', value: 'x2', kind: 'User' },
                { type: 'Identifier', original: ' y123', value: 'y123', kind: 'User' },
                { type: 'Identifier', original: ' var1', value: 'var1', kind: 'User' }
            ]));
        });

        test('system identifiers (capital first letter)', () => {
            const tokens = tokenize('Pi Sin Cos Trig1');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'Pi', value: 'PI', kind: 'System' },
                { type: 'Identifier', original: ' Sin', value: 'SIN', kind: 'System' },
                { type: 'Identifier', original: ' Cos', value: 'COS', kind: 'System' },
                { type: 'Identifier', original: ' Trig1', value: 'TRIG1', kind: 'System' }
            ]));
        });

        test('user identifiers (lowercase first letter)', () => {
            const tokens = tokenize('pi sin myVar test123');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'pi', value: 'pi', kind: 'User' },
                { type: 'Identifier', original: ' sin', value: 'sin', kind: 'User' },
                { type: 'Identifier', original: ' myVar', value: 'myvar', kind: 'User' },
                { type: 'Identifier', original: ' test123', value: 'test123', kind: 'User' }
            ]));
        });

        test('mixed case normalization', () => {
            const tokens = tokenize('AbCdE fGhIj');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'AbCdE', value: 'ABCDE', kind: 'System' },
                { type: 'Identifier', original: ' fGhIj', value: 'fghij', kind: 'User' }
            ]));
        });
    });

    describe('Number tokens', () => {
        describe('integers', () => {
            test('positive integers', () => {
                const tokens = tokenize('0 12 5678');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '0', value: '0' },
                    { type: 'Number', original: ' 12', value: '12' },
                    { type: 'Number', original: ' 5678', value: '5678' }
                ]));
            });

            test('negative integers', () => {
                const tokens = tokenize('-3 -42 -0');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-3', value: '-3' },
                    { type: 'Number', original: ' -42', value: '-42' },
                    { type: 'Number', original: ' -0', value: '-0' }
                ]));
            });
        });

        describe('decimals', () => {
            test('positive decimals', () => {
                const tokens = tokenize('2.5 7.89 0.001');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '2.5', value: '2.5' },
                    { type: 'Number', original: ' 7.89', value: '7.89' },
                    { type: 'Number', original: ' 0.001', value: '0.001' }
                ]));
            });

            test('leading decimal point numbers', () => {
                const tokens = tokenize('.5 .123 -.25');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '.5', value: '.5' },
                    { type: 'Number', original: ' .123', value: '.123' },
                    { type: 'Number', original: ' -.25', value: '-.25' }
                ]));
            });

            test('negative decimals', () => {
                const tokens = tokenize('-2.5 -0.123');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-2.5', value: '-2.5' },
                    { type: 'Number', original: ' -0.123', value: '-0.123' }
                ]));
            });
        });

        describe('repeating decimals', () => {
            test('repeating decimals with fractional part', () => {
                const tokens = tokenize('0.12#45 1.3#7');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '0.12#45', value: '0.12#45' },
                    { type: 'Number', original: ' 1.3#7', value: '1.3#7' }
                ]));
            });

            test('repeating decimals without fractional part', () => {
                const tokens = tokenize('7#3 2#56');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '7#3', value: '7#3' },
                    { type: 'Number', original: ' 2#56', value: '2#56' }
                ]));
            });

            test('negative repeating decimals', () => {
                const tokens = tokenize('-0.12#45 -7#3');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-0.12#45', value: '-0.12#45' },
                    { type: 'Number', original: ' -7#3', value: '-7#3' }
                ]));
            });
        });

        describe('rationals', () => {
            test('positive rationals', () => {
                const tokens = tokenize('3/4 15/8 123/456');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '3/4', value: '3/4' },
                    { type: 'Number', original: ' 15/8', value: '15/8' },
                    { type: 'Number', original: ' 123/456', value: '123/456' }
                ]));
            });

            test('negative rationals', () => {
                const tokens = tokenize('-3/4 -1/2');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-3/4', value: '-3/4' },
                    { type: 'Number', original: ' -1/2', value: '-1/2' }
                ]));
            });

            test('rational with spaces becomes separate tokens', () => {
                const tokens = tokenize('3 / 4');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '3', value: '3' },
                    { type: 'Symbol', original: ' /', value: '/' },
                    { type: 'Number', original: ' 4', value: '4' }
                ]));
            });
        });

        describe('mixed numbers', () => {
            test('positive mixed numbers', () => {
                const tokens = tokenize('1..3/4 2..5/8');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '1..3/4', value: '1..3/4' },
                    { type: 'Number', original: ' 2..5/8', value: '2..5/8' }
                ]));
            });

            test('negative mixed numbers', () => {
                const tokens = tokenize('-1..3/4 -2..1/8');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-1..3/4', value: '-1..3/4' },
                    { type: 'Number', original: ' -2..1/8', value: '-2..1/8' }
                ]));
            });
        });

        describe('intervals', () => {
            test('simple intervals', () => {
                const tokens = tokenize('2:5 1.5:2.7');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '2:5', value: '2:5' },
                    { type: 'Number', original: ' 1.5:2.7', value: '1.5:2.7' }
                ]));
            });

            test('complex intervals', () => {
                const tokens = tokenize('3/4:1.23#56 1..3/4:2..1/8');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '3/4:1.23#56', value: '3/4:1.23#56' },
                    { type: 'Number', original: ' 1..3/4:2..1/8', value: '1..3/4:2..1/8' }
                ]));
            });

            test('negative intervals', () => {
                const tokens = tokenize('-5:-2 -1.5:3.7');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-5:-2', value: '-5:-2' },
                    { type: 'Number', original: ' -1.5:3.7', value: '-1.5:3.7' }
                ]));
            });
        });

        describe('scientific notation', () => {
            test('positive scientific notation', () => {
                const tokens = tokenize('5E6 1.23E-2 2.5E+3');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '5E6', value: '5E6' },
                    { type: 'Number', original: ' 1.23E-2', value: '1.23E-2' },
                    { type: 'Number', original: ' 2.5E+3', value: '2.5E+3' }
                ]));
            });

            test('negative scientific notation', () => {
                const tokens = tokenize('-5E6 -1.23E-2');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-5E6', value: '-5E6' },
                    { type: 'Number', original: ' -1.23E-2', value: '-1.23E-2' }
                ]));
            });
        });

        describe('numbers with units', () => {
            test('basic units', () => {
                const tokens = tokenize('3.2~m~ 9.8~m/s~ 1/3~kg~');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '3.2~m~', value: '3.2~m~' },
                    { type: 'Number', original: ' 9.8~m/s~', value: '9.8~m/s~' },
                    { type: 'Number', original: ' 1/3~kg~', value: '1/3~kg~' }
                ]));
            });

            test('negative numbers with units', () => {
                const tokens = tokenize('-3.2~m~ -9.8~m/s2~');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '-3.2~m~', value: '-3.2~m~' },
                    { type: 'Number', original: ' -9.8~m/s2~', value: '-9.8~m/s2~' }
                ]));
            });

            test('complex numbers with units', () => {
                const tokens = tokenize('1..3/4~ft~ 2.5#3~Hz~');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '1..3/4~ft~', value: '1..3/4~ft~' },
                    { type: 'Number', original: ' 2.5#3~Hz~', value: '2.5#3~Hz~' }
                ]));
            });
        });

        describe('numbers with algebraic extensions', () => {
            test('imaginary numbers', () => {
                const tokens = tokenize('2~i~ -5~j~ 3.14~i~');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '2~i~', value: '2~i~' },
                    { type: 'Number', original: ' -5~j~', value: '-5~j~' },
                    { type: 'Number', original: ' 3.14~i~', value: '3.14~i~' }
                ]));
            });

            test('algebraic extensions', () => {
                const tokens = tokenize('1~sqrt2~ 3/4~sqrt3~');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '1~sqrt2~', value: '1~sqrt2~' },
                    { type: 'Number', original: ' 3/4~sqrt3~', value: '3/4~sqrt3~' }
                ]));
            });
        });

        describe('decimal intervals', () => {
            test('decimal with interval notation', () => {
                const tokens = tokenize('1.23[56:67] 0.5[+1,-2]');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '1.23[56:67]', value: '1.23[56:67]' },
                    { type: 'Number', original: ' 0.5[+1,-2]', value: '0.5[+1,-2]' }
                ]));
            });
        });
    });

    describe('String tokens', () => {
        describe('double quotes', () => {
            test('simple quoted strings', () => {
                const tokens = tokenize('"hello" "world"');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '"hello"', value: 'hello', kind: 'quote' },
                    { type: 'String', original: ' "world"', value: 'world', kind: 'quote' }
                ]));
            });

            test('quoted strings preserve raw content', () => {
                const tokens = tokenize('" hello " " world  "');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '" hello "', value: ' hello ', kind: 'quote' },
                    { type: 'String', original: ' " world  "', value: ' world  ', kind: 'quote' }
                ]));
            });

            test('quoted strings with spaces preserve exact content', () => {
                const tokens = tokenize('" " "  " "   "');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '" "', value: ' ', kind: 'quote' },
                    { type: 'String', original: ' "  "', value: '  ', kind: 'quote' },
                    { type: 'String', original: ' "   "', value: '   ', kind: 'quote' }
                ]));
            });

            test('unmatched empty quotes throw error', () => {
                expect(() => tokenize('""')).toThrow('Delimiter unmatched. Need');
            });

            test('multiple quote delimiters', () => {
                const tokens = tokenize('""complex string"" """even more complex"""');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '""complex string""', value: 'complex string', kind: 'quote' },
                    { type: 'String', original: ' """even more complex"""', value: 'even more complex', kind: 'quote' }
                ]));
            });

            test('quotes inside different length delimiters', () => {
                const tokens = tokenize('""string with "quotes" inside""');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '""string with "quotes" inside""', value: 'string with "quotes" inside', kind: 'quote' }
                ]));
            });

            test('strings with newlines', () => {
                const tokens = tokenize('"multi\nline\nstring"');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '"multi\nline\nstring"', value: 'multi\nline\nstring', kind: 'quote' }
                ]));
            });
        });

        describe('backticks', () => {
            test('simple backtick strings', () => {
                const tokens = tokenize('`hello` `P(x):x^2+1`');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '`hello`', value: 'hello', kind: 'backtick' },
                    { type: 'String', original: ' `P(x):x^2+1`', value: 'P(x):x^2+1', kind: 'backtick' }
                ]));
            });

            test('multiple backtick delimiters', () => {
                const tokens = tokenize('``code with ` inside`` ```even more```');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '``code with ` inside``', value: 'code with ` inside', kind: 'backtick' },
                    { type: 'String', original: ' ```even more```', value: 'even more', kind: 'backtick' }
                ]));
            });

            test('type-notated numbers', () => {
                const tokens = tokenize('`F:6/8` `P(x):2x^2+3x+1`');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '`F:6/8`', value: 'F:6/8', kind: 'backtick' },
                    { type: 'String', original: ' `P(x):2x^2+3x+1`', value: 'P(x):2x^2+3x+1', kind: 'backtick' }
                ]));
            });
        });

        describe('comments', () => {
            test('line comments', () => {
                const tokens = tokenize('# this is a comment\n# another comment');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '# this is a comment', value: ' this is a comment', kind: 'comment' },
                    { type: 'String', original: '\n# another comment', value: ' another comment', kind: 'comment' }
                ]));
            });

            test('block comments', () => {
                const tokens = tokenize('/* simple block */ /** doc comment **/');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '/* simple block */', value: ' simple block ', kind: 'comment' },
                    { type: 'String', original: ' /** doc comment **/', value: ' doc comment ', kind: 'comment' }
                ]));
            });

            test('nested star count in comments', () => {
                const tokens = tokenize('/*** comment with ** inside ***/');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '/*** comment with ** inside ***/', value: ' comment with ** inside ', kind: 'comment' }
                ]));
            });

            test('multiline block comments', () => {
                const tokens = tokenize('/*\nmultiline\ncomment\n*/');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '/*\nmultiline\ncomment\n*/', value: '\nmultiline\ncomment\n', kind: 'comment' }
                ]));
            });
        });

        describe('unit change strings', () => {
            test('unit change notation', () => {
                const tokens = tokenize('~~m~ ~~kg~');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '~~m~', value: 'm', kind: 'unit change' },
                    { type: 'String', original: ' ~~kg~', value: 'kg', kind: 'unit change' }
                ]));
            });

            test('empty unit change', () => {
                const tokens = tokenize('~~~ ~~a~');
                expect(tokens).toEqual(withEnd([
                    { type: 'String', original: '~~~', value: '', kind: 'unit change' },
                    { type: 'String', original: ' ~~a~', value: 'a', kind: 'unit change' }
                ]));
            });
        });
    });

    describe('Symbol tokens', () => {
        describe('assignment and equations', () => {
            test('assignment operators', () => {
                const tokens = tokenize(':=: :>=: :<=: :>: :<: :=> :=');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: ':=:', value: ':=:' },
                    { type: 'Symbol', original: ' :>=:', value: ':>=:' },
                    { type: 'Symbol', original: ' :<=:', value: ':<=:' },
                    { type: 'Symbol', original: ' :>:', value: ':>:' },
                    { type: 'Symbol', original: ' :<:', value: ':<:' },
                    { type: 'Symbol', original: ' :=>', value: ':=>' },
                    { type: 'Symbol', original: ' :=', value: ':=' }
                ]));
            });

            test('boolean operators', () => {
                const tokens = tokenize('?<= ?>= ?< ?> ?=');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '?<=', value: '?<=' },
                    { type: 'Symbol', original: ' ?>=', value: '?>=' },
                    { type: 'Symbol', original: ' ?<', value: '?<' },
                    { type: 'Symbol', original: ' ?>', value: '?>' },
                    { type: 'Symbol', original: ' ?=', value: '?=' }
                ]));
            });
        });

        describe('pipe operators', () => {
            test('pipe operators', () => {
                const tokens = tokenize('||> |>> |>: |>? |+ |* |: |; |^ |?');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '||>', value: '||>' },
                    { type: 'Symbol', original: ' |>>', value: '|>>' },
                    { type: 'Symbol', original: ' |>:', value: '|>:' },
                    { type: 'Symbol', original: ' |>?', value: '|>?' },
                    { type: 'Symbol', original: ' |+', value: '|+' },
                    { type: 'Symbol', original: ' |*', value: '|*' },
                    { type: 'Symbol', original: ' |:', value: '|:' },
                    { type: 'Symbol', original: ' |;', value: '|;' },
                    { type: 'Symbol', original: ' |^', value: '|^' },
                    { type: 'Symbol', original: ' |?', value: '|?' }
                ]));
            });
        });

        describe('division and modulo', () => {
            test('division operators', () => {
                const tokens = tokenize('/% /^ /~');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '/%', value: '/%' },
                    { type: 'Symbol', original: ' /^', value: '/^' },
                    { type: 'Symbol', original: ' /~', value: '/~' }
                ]));
            });
        });

        describe('interval operators', () => {
            test('interval operators', () => {
                const tokens = tokenize('::+ ::- :/+ :/% :: :+ :- :/ :%');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '::+', value: '::+' },
                    { type: 'Symbol', original: ' ::-', value: '::-' },
                    { type: 'Symbol', original: ' :/+', value: ':/+' },
                    { type: 'Symbol', original: ' :/%', value: ':/%' },
                    { type: 'Symbol', original: ' ::', value: '::' },
                    { type: 'Symbol', original: ' :+', value: ':+' },
                    { type: 'Symbol', original: ' :-', value: ':-' },
                    { type: 'Symbol', original: ' :/', value: ':/' },
                    { type: 'Symbol', original: ' :%', value: ':%' }
                ]));
            });
        });

        describe('basic operators', () => {
            test('arithmetic operators', () => {
                const tokens = tokenize('+ - * / ^ ** %');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '+', value: '+' },
                    { type: 'Symbol', original: ' -', value: '-' },
                    { type: 'Symbol', original: ' *', value: '*' },
                    { type: 'Symbol', original: ' /', value: '/' },
                    { type: 'Symbol', original: ' ^', value: '^' },
                    { type: 'Symbol', original: ' **', value: '**' },
                    { type: 'Symbol', original: ' %', value: '%' }
                ]));
            });

            test('comparison operators', () => {
                const tokens = tokenize('<= >= == !=');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '<=', value: '<=' },
                    { type: 'Symbol', original: ' >=', value: '>=' },
                    { type: 'Symbol', original: ' ==', value: '==' },
                    { type: 'Symbol', original: ' !=', value: '!=' }
                ]));
            });

            test('function operators', () => {
                const tokens = tokenize('-> => \'');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '->', value: '->' },
                    { type: 'Symbol', original: ' =>', value: '=>' },
                    { type: 'Symbol', original: ' \'', value: '\'' }
                ]));
            });
        });

        describe('brackets and punctuation', () => {
            test('brackets', () => {
                const tokens = tokenize('{{ }} ( ) [ ] { }');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: '{{', value: '{{' },
                    { type: 'Symbol', original: ' }}', value: '}}' },
                    { type: 'Symbol', original: ' (', value: '(' },
                    { type: 'Symbol', original: ' )', value: ')' },
                    { type: 'Symbol', original: ' [', value: '[' },
                    { type: 'Symbol', original: ' ]', value: ']' },
                    { type: 'Symbol', original: ' {', value: '{' },
                    { type: 'Symbol', original: ' }', value: '}' }
                ]));
            });

            test('punctuation', () => {
                const tokens = tokenize(', ; . ~ @ _');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: ',', value: ',' },
                    { type: 'Symbol', original: ' ;', value: ';' },
                    { type: 'Symbol', original: ' .', value: '.' },
                    { type: 'Symbol', original: ' ~', value: '~' },
                    { type: 'Symbol', original: ' @', value: '@' },
                    { type: 'Symbol', original: ' _', value: '_' }
                ]));
            });
        });

        describe('maximal munch principle', () => {
            test('longer symbols take precedence', () => {
                const tokens = tokenize(':= :=:');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: ':=', value: ':=' },
                    { type: 'Symbol', original: ' :=:', value: ':=:' }
                ]));
            });

            test('complex symbol combinations', () => {
                const tokens = tokenize(':=:||>|>>');
                expect(tokens).toEqual(withEnd([
                    { type: 'Symbol', original: ':=:', value: ':=:' },
                    { type: 'Symbol', original: '||>', value: '||>' },
                    { type: 'Symbol', original: '|>>', value: '|>>' }
                ]));
            });

            test('symbol vs number disambiguation', () => {
                const tokens = tokenize('3.14 ... .5');
                expect(tokens).toEqual(withEnd([
                    { type: 'Number', original: '3.14', value: '3.14' },
                    { type: 'Symbol', original: ' .', value: '.' },
                    { type: 'Symbol', original: '.', value: '.' },
                    { type: 'Symbol', original: '.', value: '.' },
                    { type: 'Number', original: ' .5', value: '.5' }
                ]));
            });
        });
    });

    describe('Complex expressions', () => {
        test('mathematical expression', () => {
            const tokens = tokenize('x^2 + 3*y - 1/2');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: '^', value: '^' },
                { type: 'Number', original: '2', value: '2' },
                { type: 'Symbol', original: ' +', value: '+' },
                { type: 'Number', original: ' 3', value: '3' },
                { type: 'Symbol', original: '*', value: '*' },
                { type: 'Identifier', original: 'y', value: 'y', kind: 'User' },
                { type: 'Symbol', original: ' -', value: '-' },
                { type: 'Number', original: ' 1/2', value: '1/2' }
            ]));
        });

        test('function assignment', () => {
            const tokens = tokenize('Sin(x) := x^2 + 1');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'Sin', value: 'SIN', kind: 'System' },
                { type: 'Symbol', original: '(', value: '(' },
                { type: 'Identifier', original: 'x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: ')', value: ')' },
                { type: 'Symbol', original: ' :=', value: ':=' },
                { type: 'Identifier', original: ' x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: '^', value: '^' },
                { type: 'Number', original: '2', value: '2' },
                { type: 'Symbol', original: ' +', value: '+' },
                { type: 'Number', original: ' 1', value: '1' }
            ]));
        });

        test('interval with mixed types', () => {
            const tokens = tokenize('1..3/4:2.5#6~m~');
            expect(tokens).toEqual(withEnd([
                { type: 'Number', original: '1..3/4:2.5#6~m~', value: '1..3/4:2.5#6~m~' }
            ]));
        });

        test('mixed tokens with comments', () => {
            const tokens = tokenize('x + 2 /* addition */ # line comment\n:= 5');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: ' +', value: '+' },
                { type: 'Number', original: ' 2', value: '2' },
                { type: 'String', original: ' /* addition */', value: ' addition ', kind: 'comment' },
                { type: 'String', original: ' # line comment', value: ' line comment', kind: 'comment' },
                { type: 'Symbol', original: '\n:=', value: ':=' },
                { type: 'Number', original: ' 5', value: '5' }
            ]));
        });

        test('string with typed literal', () => {
            const tokens = tokenize('`F:3/4` + 2.5');
            expect(tokens).toEqual(withEnd([
                { type: 'String', original: '`F:3/4`', value: 'F:3/4', kind: 'backtick' },
                { type: 'Symbol', original: ' +', value: '+' },
                { type: 'Number', original: ' 2.5', value: '2.5' }
            ]));
        });

        test('pipe operation sequence', () => {
            const tokens = tokenize('[1,2,3] |>> Sin |>? x -> x > 0');
            expect(tokens).toEqual(withEnd([
                { type: 'Symbol', original: '[', value: '[' },
                { type: 'Number', original: '1', value: '1' },
                { type: 'Symbol', original: ',', value: ',' },
                { type: 'Number', original: '2', value: '2' },
                { type: 'Symbol', original: ',', value: ',' },
                { type: 'Number', original: '3', value: '3' },
                { type: 'Symbol', original: ']', value: ']' },
                { type: 'Symbol', original: ' |>>', value: '|>>' },
                { type: 'Identifier', original: ' Sin', value: 'SIN', kind: 'System' },
                { type: 'Symbol', original: ' |>?', value: '|>?' },
                { type: 'Identifier', original: ' x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: ' ->', value: '->' },
                { type: 'Identifier', original: ' x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: ' >', value: '>' },
                { type: 'Number', original: ' 0', value: '0' }
            ]));
        });
    });

    describe('Edge cases and error handling', () => {
        test('unmatched quotes throw error', () => {
            expect(() => tokenize('x + "unclosed string')).toThrow('Delimiter unmatched. Need');
        });

        test('unmatched backticks throw error', () => {
            expect(() => tokenize('x + `unclosed backtick')).toThrow('Delimiter unmatched. Need');
        });

        test('unmatched block comment throws error', () => {
            expect(() => tokenize('x + /* unclosed comment')).toThrow('Delimiter unmatched. Need');
        });

        test('unmatched unit change throws error', () => {
            expect(() => tokenize('x + ~~unclosed')).toThrow('Delimiter unmatched. Need');
        });

        test('minus not immediately followed by digit is symbol', () => {
            const tokens = tokenize('x - y');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: ' -', value: '-' },
                { type: 'Identifier', original: ' y', value: 'y', kind: 'User' }
            ]));
        });

        test('minus with space before digit is symbol', () => {
            const tokens = tokenize('- 3');
            expect(tokens).toEqual(withEnd([
                { type: 'Symbol', original: '-', value: '-' },
                { type: 'Number', original: ' 3', value: '3' }
            ]));
        });

        test('number patterns with spaces break into separate tokens', () => {
            const tokens = tokenize('1 .. 3 / 4');
            expect(tokens).toEqual(withEnd([
                { type: 'Number', original: '1', value: '1' },
                { type: 'Symbol', original: ' .', value: '.' },
                { type: 'Symbol', original: '.', value: '.' },
                { type: 'Number', original: ' 3', value: '3' },
                { type: 'Symbol', original: ' /', value: '/' },
                { type: 'Number', original: ' 4', value: '4' }
            ]));
        });

        test('unit with spaces fails', () => {
            const tokens = tokenize('3.2~ m ~');
            expect(tokens).toEqual(withEnd([
                { type: 'Number', original: '3.2', value: '3.2' },
                { type: 'Symbol', original: '~', value: '~' },
                { type: 'Identifier', original: ' m', value: 'm', kind: 'User' },
                { type: 'Symbol', original: ' ~', value: '~' }
            ]));
        });

        test('leading decimal numbers are recognized', () => {
            const tokens = tokenize('.5 + x');
            expect(tokens).toEqual([
                { type: 'Number', original: '.5', value: '.5' },
                { type: 'Symbol', original: ' +', value: '+' },
                { type: 'Identifier', original: ' x', value: 'x', kind: 'User' },
                { type: 'End', original: '', value: null }
            ]);
        });

        test('unicode identifiers', () => {
            const tokens = tokenize('αβγ δεζ Αβγ Δεζ');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'αβγ', value: 'αβγ', kind: 'User' },
                { type: 'Identifier', original: ' δεζ', value: 'δεζ', kind: 'User' },
                { type: 'Identifier', original: ' Αβγ', value: 'ΑΒΓ', kind: 'System' },
                { type: 'Identifier', original: ' Δεζ', value: 'ΔΕΖ', kind: 'System' }
            ]));
        });

        test('whitespace input produces End token', () => {
            const tokens = tokenize('   \t\n   ');
            expect(tokens).toEqual([
                { type: 'End', original: '   \t\n   ', value: null }
            ]);
        });

        test('single character tokens', () => {
            const tokens = tokenize('x+y*z/w^v');
            expect(tokens).toEqual(withEnd([
                { type: 'Identifier', original: 'x', value: 'x', kind: 'User' },
                { type: 'Symbol', original: '+', value: '+' },
                { type: 'Identifier', original: 'y', value: 'y', kind: 'User' },
                { type: 'Symbol', original: '*', value: '*' },
                { type: 'Identifier', original: 'z', value: 'z', kind: 'User' },
                { type: 'Symbol', original: '/', value: '/' },
                { type: 'Identifier', original: 'w', value: 'w', kind: 'User' },
                { type: 'Symbol', original: '^', value: '^' },
                { type: 'Identifier', original: 'v', value: 'v', kind: 'User' }
            ]));
        });
    });

    describe('Token properties', () => {
        test('all tokens have required properties', () => {
            const tokens = tokenize('x + 2.5 "hello" /*comment*/');
            expect(tokens[tokens.length - 1].type).toBe('End');
            tokens.forEach(token => {
                expect(token).toHaveProperty('type');
                expect(token).toHaveProperty('original');
                expect(token).toHaveProperty('value');
                expect(['Identifier', 'Number', 'String', 'Symbol', 'End']).toContain(token.type);
                
                if (token.type === 'Identifier' || token.type === 'String') {
                    expect(token).toHaveProperty('kind');
                }
            });
        });

        test('identifier kinds are correct', () => {
            const tokens = tokenize('x Sin myVar COS');
            expect(tokens[0].kind).toBe('User');
            expect(tokens[1].kind).toBe('System');
            expect(tokens[2].kind).toBe('User');
            expect(tokens[3].kind).toBe('System');
        });

        test('string kinds are correct', () => {
            const tokens = tokenize('"quote" `backtick` /*comment*/ ~~unit~');
            expect(tokens[0].kind).toBe('quote');
            expect(tokens[1].kind).toBe('backtick');
            expect(tokens[2].kind).toBe('comment');
            expect(tokens[3].kind).toBe('unit change');
        });

        test('original concatenation preserves input', () => {
            const inputs = [
                'x + 2',
                'Sin(x) := x^2',
                '3/4 + 1..2/3',
                '"hello world" + `F:3/4`',
                '/* comment */ # line comment',
                '1.23E-5~m/s~ + αβγ',
                '.5 + -.25'
            ];

            inputs.forEach(input => {
                const tokens = tokenize(input);
                const reconstructed = tokens.map(t => t.original).join('');
                expect(reconstructed).toBe(input);
            });
        });
    });
});