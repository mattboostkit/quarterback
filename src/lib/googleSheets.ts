import { google } from 'googleapis'

// For MVP, we'll use a simpler approach with API key instead of service account
// In production, you'd want to use service account credentials

export interface PersonaData {
  audienceName: string
  percentage: string
  demographics: {
    genderSplit: string
    devicePreference: string
    summary: string
  }
  topOnlineTopics: string[]
  favouriteSocialMedia: string[]
  favouriteMedia: string[]
  topInfluencers: string[]
  favouriteBrands: string[]
  topJobs: string[]
  locations: string[]
  bioKeywords: string[]
  youtubeChannels: string[]
  insights: string[]
}

class GoogleSheetsService {
  private sheets: any
  private readonly SHEET_ID = '1X5hXnmSKNYtN1jdSQGPXXJ2Fnu8gNEXyFqqIUl31L1A'
  private readonly MAIN_SHEET = 'WESTY Audience Example'

  constructor() {
    // Initialize with API key for public sheets (simpler for MVP)
    this.sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_SHEETS_API_KEY || undefined
    })
  }

  async getPersonaData(personaName?: string): Promise<PersonaData[]> {
    try {
      if (!process.env.GOOGLE_SHEETS_API_KEY) {
        console.warn('Google Sheets API key not configured')
        return this.getMockData()
      }

      // Read the main data range from WESTY Audience Example sheet
      const range = `${this.MAIN_SHEET}!A:L` // Read all data from WESTY sheet
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.SHEET_ID,
        range: range,
      })

      const rows = response.data.values || []
      
      if (rows.length === 0) {
        console.log('No data found in Google Sheets')
        return this.getMockData()
      }

      // Parse rows into PersonaData format - WESTY sheet structure
      // Row 0: Title, Row 1: Headers, Row 2+: Data
      const personas: PersonaData[] = rows
        .slice(2) // Skip title and header rows
        .filter((row: any[]) => row[0] && row[0].trim()) // Filter out empty rows
        .map((row: any[], index: number) => {
          // Extract persona name and details from first column
          const firstColumn = row[0] || ''
          const parts = firstColumn.split(':')
          const nameAndDemo = parts[0] || `Persona ${index + 1}`
          const summary = parts[1] || ''
          
          return {
            audienceName: nameAndDemo.trim(),
            percentage: row[1] || '0%',
            demographics: {
              genderSplit: nameAndDemo.includes('Male') ? nameAndDemo.match(/\d+% Male/)?.[0] || '' : '',
              devicePreference: nameAndDemo.includes('iOS') ? nameAndDemo.match(/\d+% iOS/)?.[0] || '' : '',
              summary: summary.trim()
            },
            topOnlineTopics: this.parseCommaSeparated(row[2]),
            favouriteSocialMedia: this.parseCommaSeparated(row[3]),
            favouriteMedia: this.parseCommaSeparated(row[4]),
            topInfluencers: this.parseCommaSeparated(row[5]),
            favouriteBrands: this.parseCommaSeparated(row[6]),
            topJobs: this.parseCommaSeparated(row[7]),
            locations: this.parseCommaSeparated(row[8]),
            bioKeywords: this.parseCommaSeparated(row[9]),
            youtubeChannels: this.parseCommaSeparated(row[10]),
            insights: this.parseCommaSeparated(row[11])
          }
        })

      // Filter by persona name if specified
      if (personaName) {
        return personas.filter(p => 
          p.audienceName.toLowerCase().includes(personaName.toLowerCase())
        )
      }

      return personas

    } catch (error) {
      console.error('Error reading Google Sheets:', error)
      console.log('Falling back to mock data')
      return this.getMockData()
    }
  }

  private parseCommaSeparated(value: string): string[] {
    if (!value || typeof value !== 'string') return []
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  private getMockData(): PersonaData[] {
    return [
      {
        audienceName: "Informed Professionals",
        percentage: "14%",
        demographics: {
          genderSplit: "75% Male",
          devicePreference: "62% iOS",
          summary: "Informed Professional Londoners are deeply engaged in the vibrant life of London, with a keen interest in politics and cultural discourse."
        },
        topOnlineTopics: ["People and Society", "Children", "Parents", "Mental Health", "Experiences", "Wellbeing", "Diversity", "Teaching", "Books", "Law and Gov", "Business", "News", "Politics", "Movies"],
        favouriteSocialMedia: ["LinkedIn", "X", "Instagram", "YouTube", "The Independent"],
        favouriteMedia: ["Private Eye", "Guardian", "QI", "The Onion", "The Independent", "Radio 4", "BBC Politics", "Tech Crunch", "WSJ", "LBC", "VICE", "Mashable", "Evening Standard", "BBC Newsnight", "Economist"],
        topInfluencers: ["David Mitchell", "Charlie Brooker", "Sadiq Khan", "Dara O'Brien", "Eddie Izzard", "Robert Peston", "Alastair Campbell", "Jeremy Corbyn", "Ed Miliband", "Nick Robinson", "Caroline Lucas", "Giles Coren", "Secret Footballer", "Jonathan Pie"],
        favouriteBrands: ["Amnesty International", "NASA", "Glastonbury", "Met Office", "UN", "Channel 4", "YouGov", "National Theatre", "SW Rail", "Labour Party"],
        topJobs: ["Director", "Writer", "Editor", "Founder", "Head", "Artist", "Creative", "Producer", "CEO", "Journalist", "Actor", "Activist", "Singer", "Presenter", "Trainer", "Comedian", "Investor", "Chef"],
        locations: ["London", "Essex", "Hertfordshire", "Kent", "Manchester", "Bristol", "Enfield", "Surrey", "Cambridge", "Norfolk", "Wales"],
        bioKeywords: ["Business", "Music", "Health", "Food", "Community", "Digital", "Art", "Events", "Local", "Marketing", "Family", "Professional", "Travel", "Tech", "Development"],
        youtubeChannels: ["Mrwhosetheboss", "Tech Spurt", "History Hit", "Tom Scott", "The Athletic", "Sky Sports Premier League", "TNT Sports", "COPA90", "talkSPORT", "ZONEofTECH", "Munya Chawawe", "QI", "Private Eye", "Guardian News", "BBC News", "Novara Media", "TED"],
        insights: ["Professional Skew", "Intelligent/Educated", "Keen Learners", "Politically Engaged", "Mainstream Media", "Successful financially", "Creative", "Multi Dimensional", "Innovative and interested in tech", "Left Leaning", "Global outlook", "Comedy and Satire", "Rock Music", "Alcohol", "Art and design"]
      }
    ]
  }

  // Convert PersonaData to CSV-like format for existing pipeline
  convertToCSVData(persona: PersonaData): Record<string, string>[] {
    // Create individual records for each data point
    const records: Record<string, string>[] = []

    // Add demographic data
    records.push({
      'Category': 'Demographics',
      'Type': 'Gender Split',
      'Value': persona.demographics.genderSplit,
      'Source': 'Google Sheets'
    })

    records.push({
      'Category': 'Demographics', 
      'Type': 'Device Preference',
      'Value': persona.demographics.devicePreference,
      'Source': 'Google Sheets'
    })

    // Add all the array data
    const categories = [
      { key: 'topOnlineTopics', category: 'Online Topics' },
      { key: 'favouriteSocialMedia', category: 'Social Media' },
      { key: 'favouriteMedia', category: 'Media Preferences' },
      { key: 'topInfluencers', category: 'Influencers' },
      { key: 'favouriteBrands', category: 'Brand Preferences' },
      { key: 'topJobs', category: 'Job Titles' },
      { key: 'locations', category: 'Locations' },
      { key: 'bioKeywords', category: 'Bio Keywords' },
      { key: 'youtubeChannels', category: 'YouTube Channels' },
      { key: 'insights', category: 'Insights' }
    ]

    categories.forEach(({ key, category }) => {
      const values = persona[key as keyof PersonaData] as string[]
      values.forEach(value => {
        records.push({
          'Category': category,
          'Type': 'Preference',
          'Value': value,
          'Source': 'Google Sheets'
        })
      })
    })

    return records
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!process.env.GOOGLE_SHEETS_API_KEY) {
        return {
          success: false,
          message: 'Google Sheets API key not configured. Using mock data.'
        }
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.SHEET_ID,
        fields: 'properties.title,sheets.properties.title'
      })

      return {
        success: true,
        message: 'Successfully connected to Google Sheets',
        data: {
          title: response.data.properties.title,
          sheets: response.data.sheets?.map((sheet: any) => sheet.properties.title)
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

export const googleSheetsService = new GoogleSheetsService()