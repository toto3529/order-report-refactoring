import type { Promotion } from "../models/Promotions"

export function mapPromotions(rows: string[][]): Promotion[] {
	return rows.map((r) => ({
		code: r[0],
		type: r[1],
		value: r[2],
		active: r[3] !== "false",
	}))
}
