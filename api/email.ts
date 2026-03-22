import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESClient, SendEmailCommand, type SendEmailCommandInput } from '@aws-sdk/client-ses'

const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

const buildEmailBody = (to: string): string => `
Hei,

Du har meldt deg på Fase 2. Vi har ventet på deg.

================================================================
OPPDRAGET
================================================================

Vi har identifisert denne nettsiden som en potensiell vektor for
å nå frem med et angrep mot Mamaboi87.

Nettsiden, mysweetjournal, brukes som en dagboktjeneste for et
ganske stort antall brukere fra hele verden. Innholdet er veldig
sensitivt, og er derfor godt beskyttet.

Vi har klart å lage en klone av nettsiden, med en tilhørende
server og en database som burde ha Mamaboi87 som en av brukerne.
Tjenesten er fremdeles beskyttet, men burde være mer sårbar enn
den online varianten.

Det vi ønsker at du skal gjøre:

  1. Få tilgang til adminbrukeren på nettsiden
  2. Hent ut brukernavn og passord til korrekt bruker
  3. Logg deg inn som Mamaboi87, og hent ut konfidensiell informasjon
  4. Bruk det du lærer om målet til å skreddersy en phishingepost.
     Send denne til: tuan.minh.nguyen@ambita.com

NB.
Vi er usikre på hvordan passordene til tjenesten lagres, men er
trygge på at om de er lagret som hasher, så er de ikke saltede.
Det burde være en smal sak å cracke hashene med litt smart bruk
av Hash crackers.

================================================================
SPØRSMÅL
================================================================

  1. Hvilken angrepsmetodikk brukte du for å få tilgang til
     admin-brukeren? Hvordan kan du beskytte en nettside mot dette?
     Legg ved et screenshot av listen du får med passord.

  2. Hva er det ikke-hashede passordet til Mamaboi87?
     Hvordan fant du det?

  3. Hvilken form for phishing utførte du som en del av dette
     oppdraget? Nevn noen andre varianter også.
     Legg ved et screenshot av phishing-eposten din.

  4. Er dette angrepsscenarioet lovlig? Anta at alt er ekte,
     hostet online og det faktisk var fra gardesjefen sitt kontor
     du hentet malwaren. Hva av det du har gjort er lov og hva
     er ulovlig?

================================================================
TEKNISK OPPSETT
================================================================

Start den klonede tjenesten med Docker:

  docker pull tmn97/fase2/mysweetjournal
  docker run -p 5000:5000 tmn97/fase2/mysweetjournal

Appen kjører på: http://localhost:5000

================================================================

Lykke til, ${to.split('@')[0]}.

— Fase 2
`

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { to } = req.body as { to?: string }

  if (!to || !/\S+@\S+\.\S+/.test(to.toLowerCase())) {
    res.status(400).json({ message: 'Invalid email address' })
    return
  }

  const fromEmail = process.env.SES_FROM_EMAIL
  if (!fromEmail) {
    res.status(500).json({ message: 'Server misconfiguration: missing SES_FROM_EMAIL' })
    return
  }

  const params: SendEmailCommandInput = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: 'Fase 2 — Du er valgt',
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: buildEmailBody(to),
          Charset: 'UTF-8',
        },
      },
    },
  }

  try {
    await ses.send(new SendEmailCommand(params))
    res.status(200).json({ message: 'OK' })
  } catch (err) {
    console.error('SES error:', err)
    res.status(500).json({ message: 'Failed to send email' })
  }
}
