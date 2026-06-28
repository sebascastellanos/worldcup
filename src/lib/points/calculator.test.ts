import { describe, it, expect } from 'vitest'
import { calcularPuntos } from './calculator'

describe('calcularPuntos — exact_score', () => {
  it('retorna 5 para marcador exacto', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 2, predAway: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5)
  })
  it('retorna 0 para ganador correcto con marcador incorrecto', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 3, predAway: 0 }, { homeScore: 2, awayScore: 1 })).toBe(0)
  })
  it('retorna 0 para marcador y ganador incorrectos', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 0, predAway: 1 }, { homeScore: 2, awayScore: 1 })).toBe(0)
  })
})

describe('calcularPuntos — 1X2 fase de grupos (sin winner)', () => {
  it('retorna 1 para home_win correcto', () => {
    expect(calcularPuntos({ predType: 'home_win' }, { homeScore: 2, awayScore: 0 })).toBe(1)
  })
  it('retorna 0 para home_win incorrecto', () => {
    expect(calcularPuntos({ predType: 'home_win' }, { homeScore: 0, awayScore: 1 })).toBe(0)
  })
  it('retorna 1 para draw correcto', () => {
    expect(calcularPuntos({ predType: 'draw' }, { homeScore: 1, awayScore: 1 })).toBe(1)
  })
  it('retorna 1 para away_win correcto', () => {
    expect(calcularPuntos({ predType: 'away_win' }, { homeScore: 0, awayScore: 2 })).toBe(1)
  })
  it('retorna 0 para away_win incorrecto', () => {
    expect(calcularPuntos({ predType: 'away_win' }, { homeScore: 1, awayScore: 1 })).toBe(0)
  })
})

describe('calcularPuntos — 1X2 eliminatorias (con winner)', () => {
  it('retorna 1 para home_win correcto via penales (1-1 FT, gana local)', () => {
    expect(calcularPuntos({ predType: 'home_win' }, { homeScore: 1, awayScore: 1, winner: 'HOME_TEAM' })).toBe(1)
  })
  it('retorna 0 para home_win incorrecto via penales', () => {
    expect(calcularPuntos({ predType: 'home_win' }, { homeScore: 1, awayScore: 1, winner: 'AWAY_TEAM' })).toBe(0)
  })
  it('retorna 1 para away_win correcto via tiempo extra', () => {
    expect(calcularPuntos({ predType: 'away_win' }, { homeScore: 1, awayScore: 2, winner: 'AWAY_TEAM' })).toBe(1)
  })
  it('retorna 0 para draw en eliminatorias siempre', () => {
    expect(calcularPuntos({ predType: 'draw' }, { homeScore: 1, awayScore: 1, winner: 'HOME_TEAM' })).toBe(0)
  })
})
