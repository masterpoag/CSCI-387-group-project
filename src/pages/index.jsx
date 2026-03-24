import React from "react";
import { Link } from "react-router-dom";

export default function HomePage({/* Add Vars here for passthrough*/}) {
  const featureItems = [
    {
      title: "Smart Planning",
      description: "Turn scattered meal ideas into a clear weekly plan with less manual effort.",
    },
    {
      title: "Recipe Discovery",
      description: "Find recipes quickly and keep your favorite personal recipes right beside public ones.",
    },
    {
      title: "Goal-Aware Choices",
      description: "Stay aligned to calorie and nutrition goals while still making meals you actually want.",
    },
  ];

  const flowSteps = [
    "Create your account and set nutrition preferences.",
    "Search, save, and organize recipes you care about.",
    "Build consistent habits with simple daily decisions.",
  ];

  return (
    <main className="homePage">
      <div className="homePageShell">
        <section className="homeHero">
          <p className="homeKicker">Built for better food decisions</p>
          <h1 className="homeTitle">Plan smarter meals with the speed of modern AI products.</h1>
          <p className="homeSubtitle">
            NutriFlow brings recipe discovery, personal collections, and healthy structure into one
            focused workspace.
          </p>
          <div className="homeHeroCta">
            <Link className="homePrimaryCta" to="/login">Get Started</Link>
            <Link className="homeSecondaryCta" to="/food">Browse Recipes</Link>
          </div>
          <div className="homeProofRow" aria-label="Key highlights">
            <span className="homeProofPill">Fast setup</span>
            <span className="homeProofPill">Modern UI</span>
            <span className="homeProofPill">Goal-driven flow</span>
          </div>
        </section>

        <section className="homeFeatureGrid" aria-label="Core features">
          {featureItems.map((item) => (
            <article className="homeFeatureCard" key={item.title}>
              <h2 className="homeFeatureTitle">{item.title}</h2>
              <p className="homeFeatureDescription">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="homeWorkflow">
          <div className="homeWorkflowHeader">
            <p className="homeKicker">How it works</p>
            <h2 className="homeWorkflowTitle">Simple flow, consistent results.</h2>
          </div>
          <ol className="homeWorkflowList">
            {flowSteps.map((step) => (
              <li className="homeWorkflowStep" key={step}>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}