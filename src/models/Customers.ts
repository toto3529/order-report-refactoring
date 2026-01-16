export type CustomerLevel = "BASIC" | "PREMIUM"

export interface Customer {
	id: string
	name: string
	level: CustomerLevel
	zone: string
	currency: string
}
