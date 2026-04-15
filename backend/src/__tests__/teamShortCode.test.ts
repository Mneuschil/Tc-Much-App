import { parseTeamName, deriveShortCodes } from '../services/teamShortCode';

describe('parseTeamName', () => {
  it('parses Damen mit Altersklasse', () => {
    expect(parseTeamName('Damen 30 1 (4er)')).toEqual({
      gender: 'D',
      ageClass: 30,
      teamNum: 1,
    });
  });
  it('parses Herren ohne Altersklasse', () => {
    expect(parseTeamName('Herren 1')).toEqual({ gender: 'H', ageClass: null, teamNum: 1 });
  });
  it('parses Herren 40 mit laufender Nummer 2', () => {
    expect(parseTeamName('Herren 40 2')).toEqual({ gender: 'H', ageClass: 40, teamNum: 2 });
  });
  it('gibt gender=null bei unbekanntem Schema', () => {
    expect(parseTeamName('Jugend U14')).toEqual({ gender: null, ageClass: null, teamNum: null });
  });
});

describe('deriveShortCodes', () => {
  it('produziert Vereinsschema wie vom Marius gefordert', () => {
    const teams = [
      { id: 'a', name: 'Damen 30 1 (4er)' },
      { id: 'b', name: 'Damen 40 1 (4er)' },
      { id: 'c', name: 'Damen 50 1 (4er)' },
      { id: 'd', name: 'Herren 1' },
      { id: 'e', name: 'Herren 30 1 (4er)' },
      { id: 'f', name: 'Herren 40 1' },
      { id: 'g', name: 'Herren 40 2' },
      { id: 'h', name: 'Herren 50 1 (4er)' },
      { id: 'i', name: 'Herren 55 1 (4er)' },
      { id: 'j', name: 'Herren 65 1 (4er)' },
    ];
    const out = deriveShortCodes(teams);
    expect(out.get('a')).toBe('D30');
    expect(out.get('b')).toBe('D40');
    expect(out.get('c')).toBe('D50');
    expect(out.get('d')).toBe('H1');
    expect(out.get('e')).toBe('H30');
    expect(out.get('f')).toBe('H40-1');
    expect(out.get('g')).toBe('H40-2');
    expect(out.get('h')).toBe('H50');
    expect(out.get('i')).toBe('H55');
    expect(out.get('j')).toBe('H65');
  });

  it('nicht-schema-konforme Teams bekommen null', () => {
    const out = deriveShortCodes([{ id: 'x', name: 'Jugend U14' }]);
    expect(out.get('x')).toBeNull();
  });
});
