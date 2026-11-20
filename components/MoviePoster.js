const posters = {
  'Breaking Bad': '/posters/breaking-bad.jpg',
  'The Shawshank Redemption': '/posters/shawshank-redemption.jpg',
  'The Dark Knight': '/posters/dark-knight.jpg',
  'Better Call Saul': '/posters/better-call-saul.jpg',
  'Inception': '/posters/inception.jpg',
};

export default function MoviePoster({ title, detail = false }) {
  const src = posters[title];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${title} poster`}
      width={500}
      height={750}
      style={{
        display: 'block',
        width: detail ? 240 : '100%',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: 6,
        marginBottom: detail ? 16 : 12,
      }}
    />
  );
}
