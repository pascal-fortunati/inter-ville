export default function Home() {
  return (
    <div>
      <h1>Bienvenue sur notre page d'accueil!</h1>
      <p>Ceci est une page d'accueil simple créée avec React et JSX.</p>
      <button className="btn btn-primary" onClick={() => alert('Bonjour!')}>Cliquez-moi</button>
    </div>
  );
}
