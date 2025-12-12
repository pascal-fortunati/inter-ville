import { Link  } from "react-router-dom";
import ChallengeCard from "./components/ChallengeCard";
// TODO: fetch challenges from API
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ----------------------------------------------------------------
// Elements à décommenter une fois le back/front liés

// const [challenges, setChallenges] = useState([]);
// const [loading, setLoading] = useState(true);
// const [error, setError] = useState(null);

// useEffect(() => {
//   const fetchChallenges = async () => {
//     try {
//       const response = await axios.get('/api/challenges');
//       setChallenges(response.data);
//     } catch (err) {
//       setError(err);
//       console.error("Error fetching challenges:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchChallenges();
// }, []);

// ----------------------------------------------------------------

const challenges = [
  { id: 1, title: "Challenge 1", theme: "Thème 1", participationCount: 10, summary: "Description du challenge 1" },
  { id: 2, title: "Challenge 2", theme: "Thème 2", participationCount: 20, summary: "Description du challenge 2" },
  { id: 3, title: "Challenge 3", theme: "Thème 3", participationCount: 30, summary: "Description du challenge 3" },
  { id: 4, title: "Challenge 4", theme: "Thème 4", participationCount: 40, summary: "Description du challenge 4" },
];

const getChallengesWithMostParticipants = (challenges) => {
  if (!challenges || challenges.length === 0) {
    return [];
  }
  const maxParticipants = Math.max(...challenges.map(challenge => challenge.participants || 0));
  return challenges.filter(challenge => (challenge.participants || 0) === maxParticipants);
};


export default function Home() {
  return (
    <main className="flex flex-col min-[90vh]">
      <section className="hero min-h-[40vh]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-semibold">Inter Ville</h1>
            <p className="py-6">
              plateforme de challenges réservée aux éléves de La Plateforme <br /> <span className="italic">créez, participez, recommencez</span>
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4 text-center">Aperçu des challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center px-16 pt-8">
          {challenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
        <div className="flex justify-center mt-16">
          <Link to="/challenges" className="btn btn-primary">Voir tous les challenges</Link>
        </div>

      </section>
    </main>
  );
}
