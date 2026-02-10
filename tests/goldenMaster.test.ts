import { execSync } from "child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"

describe("Golden Master", () => {
	it("should match legacy output with reference (strict)", () => {
		// 1) Exécuter le legacy et capturer la sortie
		const output = execSync("npm run legacy", { encoding: "utf8" }).replace(/\r\n/g, "\n")

		// 2) Chemins de référence
		const expectedDir = path.join("legacy", "expected")
		const expectedFile = path.join(expectedDir, "report.txt")

		// 3) Créer le dossier si nécessaire
		if (!existsSync(expectedDir)) {
			mkdirSync(expectedDir, { recursive: true })
		}

		// 4) Créer le ficher si nécessaire
		if (!existsSync(expectedFile)) {
			writeFileSync(expectedFile, output, "utf8")
		}

		// 5) Lire le fichier de référence
		const expected = readFileSync(expectedFile, "utf8").replace(/\r\n/g, "\n")

		// 6) Exécuter le refactor et capturer la sortie
		const refactorOutput = execSync("npm run refactor", { encoding: "utf8" }).replace(/\r\n/g, "\n")

		// 7) Comparaison STRICTE : refactor vs référence legacy
		expect(refactorOutput).toBe(expected)
	})
})
