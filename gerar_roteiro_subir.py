from pathlib import Path

from fpdf import FPDF

OUT = Path(r"C:\monarca\Roteiro-subir-producao.pdf")
FONT = r"C:\Windows\Fonts\arial.ttf"
FONT_B = r"C:\Windows\Fonts\arialbd.ttf"


class Pdf(FPDF):
    def header(self):
        self.set_font("Arial", "B", 9)
        self.set_text_color(120, 90, 10)
        self.cell(0, 8, "Monarca Motos  ·  Como subir (teste e produção)", align="L")
        self.set_text_color(160, 160, 160)
        self.set_font("Arial", "", 8)
        self.cell(0, 8, "setembro 2026", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(228, 180, 18)
        self.set_line_width(0.4)
        self.line(18, 16, 192, 16)
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(220, 220, 220)
        self.line(18, self.get_y(), 192, self.get_y())
        self.set_font("Arial", "", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 8, f"{self.page_no()}/{{nb}}", align="R")


def h1(pdf: Pdf, text: str):
    pdf.set_font("Arial", "B", 16)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(0, 8, text)
    pdf.ln(2)


def h2(pdf: Pdf, text: str):
    pdf.ln(3)
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(120, 90, 10)
    pdf.multi_cell(0, 7, text)
    pdf.ln(1)


def p(pdf: Pdf, text: str):
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 5.4, text)
    pdf.ln(1.2)


def bullet(pdf: Pdf, text: str):
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(40, 40, 40)
    x = pdf.get_x()
    pdf.cell(6, 5.4, "-")
    pdf.multi_cell(0, 5.4, text)
    pdf.set_x(x)
    pdf.ln(0.4)


def step(pdf: Pdf, n: int, text: str):
    pdf.set_font("Arial", "B", 10)
    pdf.set_text_color(120, 90, 10)
    x = pdf.get_x()
    pdf.cell(8, 5.4, f"{n}.")
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 5.4, text)
    pdf.set_x(x)
    pdf.ln(0.5)


def note(pdf: Pdf, text: str):
    pdf.set_fill_color(255, 248, 225)
    pdf.set_draw_color(228, 180, 18)
    pdf.set_font("Arial", "", 9.5)
    pdf.set_text_color(70, 50, 0)
    pdf.multi_cell(0, 5.2, text, border=1, fill=True)
    pdf.ln(2)


def mono(pdf: Pdf, text: str):
    pdf.set_font("Courier", "", 9)
    pdf.set_text_color(50, 50, 50)
    pdf.set_fill_color(245, 245, 245)
    pdf.multi_cell(0, 5, text, fill=True)
    pdf.ln(1.5)


def main():
    pdf = Pdf()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_font("Arial", "", FONT)
    pdf.add_font("Arial", "B", FONT_B)
    pdf.set_margins(18, 20, 18)
    pdf.add_page()

    h1(pdf, "Como subir o Monarca Motos")
    p(
        pdf,
        "Guia prático: ambiente de teste no PC agora, e o que mudar quando for para servidor "
        "online. SudTax fica desligada até a integração — o resto do sistema já pode rodar.",
    )
    note(
        pdf,
        "Peças: motos-api (Kotlin/Ktor + Postgres) e motos-web (React/Vite). "
        "A API sobe as migrations Flyway sozinha no boot.",
    )

    h2(pdf, "1. No PC (teste / homologação)")
    step(pdf, 1, "Postgres ligado com o banco monarca_motos_db.")
    step(
        pdf,
        2,
        "Arquivo motos-api/src/main/resources/application.yaml "
        "(copie do application.yaml.example se ainda não tiver).",
    )
    step(pdf, 3, "Na pasta motos-api: gradlew run (porta 8080).")
    step(pdf, 4, "Na pasta motos-web: npm run dev (porta 8443 ou 5173).")
    step(pdf, 5, "Abra o front no navegador e faça login.")
    step(pdf, 6, "Opcional: http://localhost:8080/health — deve retornar status ok e database ok.")

    h2(pdf, "2. application.yaml — o que ajustar no teste")
    bullet(pdf, "database.url / user / password — seu Postgres local.")
    bullet(pdf, "jwt.secret — pode manter o de dev; em produção troque (≥32 caracteres).")
    bullet(
        pdf,
        "system.initialPassword — só vale na 1ª criação do usuário system. "
        "Se o system já existe, a senha NÃO muda ao reiniciar a API.",
    )
    bullet(
        pdf,
        "cors.hosts — no PC: http://localhost:8443 e http://localhost:5173 "
        "(e 127.0.0.1 se usar).",
    )
    bullet(pdf, "seed.demo: true — libera o botão Dados de teste em Empresa.")
    bullet(pdf, "sudtax.enabled: false — deixar assim até a SudTax.")
    bullet(pdf, "auth.loginMaxAttempts / loginWindowSeconds — limite de tentativas de login.")

    h2(pdf, "3. Login e dados de teste")
    bullet(pdf, "Usuário system — senha a que você já usa (ou a de system.initialPassword se banco novo).")
    bullet(pdf, "Troque a senha depois em Perfil (recomendado).")
    bullet(
        pdf,
        "Com seed.demo true: Empresa → Ligar dados de teste "
        "(demo.operador / demo.vendedor, senha demo12345).",
    )

    h2(pdf, "4. Smoke rápido (sistema fechado)")
    step(pdf, 1, "Login e escolha da filial.")
    step(pdf, 2, "Cotação do dia (se exigirDoDia estiver true).")
    step(pdf, 3, "Abrir caixa.")
    step(pdf, 4, "Venda no PDV (produto, pagamento, finalizar).")
    step(pdf, 5, "Histórico, contas a receber/pagar se usou crédito.")
    step(pdf, 6, "Dashboard: vendas do dia, clientes, caixas abertos.")

    pdf.add_page()
    h2(pdf, "5. Quando for para servidor (produção)")
    p(pdf, "Mesmo sistema; só endurecer config e rede:")
    step(pdf, 1, "Postgres com senha forte + backup/restore testado.")
    step(pdf, 2, "jwt.secret e system.initialPassword fortes (nunca os CHANGE_ME).")
    step(pdf, 3, "seed.demo: false.")
    step(pdf, 4, "cors.hosts só com a URL HTTPS do front (sem *).")
    step(
        pdf,
        5,
        "HTTPS no reverse proxy (nginx/Caddy). A API pode ficar em HTTP na rede interna.",
    )
    step(pdf, 6, "Build do front (npm run build) e servir os arquivos estáticos.")
    step(pdf, 7, "API: jar/gradle run atrás do proxy; checar GET /health.")
    step(pdf, 8, "SudTax: só depois — enabled true + baseUrl + apiKey live.")

    h2(pdf, "6. Exemplo de blocos no yaml (produção)")
    mono(
        pdf,
        "seed:\n"
        "  demo: false\n"
        "cors:\n"
        "  hosts:\n"
        "    - \"https://app.seudominio.com\"\n"
        "sudtax:\n"
        "  enabled: false\n"
        "system:\n"
        "  initialPassword: \"SENHA_FORTE_SO_NA_1A_VEZ\"",
    )

    h2(pdf, "7. Conceitos rápidos")
    bullet(pdf, "Hardening — segurança: senha system, CORS, rate limit, seed off, secrets.")
    bullet(pdf, "Health — /health diz se API e banco estão ok.")
    bullet(pdf, "Flyway — migrations V1…V26 sobem sozinhas ao iniciar a API.")

    note(
        pdf,
        "Enquanto estiver só no PC: mantenha seed.demo true se precisar do botão de teste. "
        "UI/UX e SudTax podem evoluir depois sem mudar este fluxo de subida.",
    )

    pdf.output(str(OUT))
    print(f"Gerado: {OUT}")


if __name__ == "__main__":
    main()
