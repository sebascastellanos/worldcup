import { describe, it, expect } from 'vitest'
import { calcularPuntos } from './calculator'

describe('calcularPuntos', () => {
  // Modo exact_score
  it('retorna 3 para marcador exacto', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 2, predAway: 1 }, { homeScore: 2, awayScore: 1 })).toBe(3)
  })
  it('retorna 1 para ganador correcto con marcador incorrecto (exact_score)', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 3, predAway: 0 }, { homeScore: 2, awayScore: 1 })).toBe(1)
  })
  it('retorna 0 para marcador y ganador incorrectos (exact_score)', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 0, predAway: 1 }, { homeScore: 2, awayScore: 1 })).toBe(0)
  })
  it('retorna 1 para empate correcto (exact_score)', () => {
    expect(calcularPuntos({ predType: 'exact_score', predHome: 1, predAway: 1 }, { homeScore: 0, awayScore: 0 })).toBe(1)
  })

  // Modo 1X2
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
