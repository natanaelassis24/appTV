export const SERIES = [
  {
    id: 'serie-demo',
    title: 'Serie Demo',
    category: 'Series',
    badge: 'Modelo pronto',
    year: '2026',
    maturity: '12',
    featuredLabel: 'Original do app',
    posterImage:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    backdropImage:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    synopsis:
      'Modelo de serie com temporadas e episodios para voce substituir pelos seus links autorizados. O player avanca automaticamente para o proximo episodio.',
    logo: 'SD',
    seasons: [
      {
        season: 1,
        episodes: [
          {
            id: 'serie-demo-s1e1',
            title: 'Episodio 1',
            number: 1,
            duration: '00:30',
            sourceType: 'file',
            url: 'https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4',
            description: 'Primeiro episodio do modelo de serie.',
            thumbImage:
              'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80'
          },
          {
            id: 'serie-demo-s1e2',
            title: 'Episodio 2',
            number: 2,
            duration: '00:30',
            sourceType: 'file',
            url: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
            description: 'Segundo episodio do modelo de serie com autoplay do proximo episodio.',
            thumbImage:
              'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80'
          }
        ]
      }
    ]
  }
];
