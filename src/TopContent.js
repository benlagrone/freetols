import React from 'react';

const TopContent = () => (
  <section className="content-section top">
    <header>
      <h1>Welcome to Our Site</h1>
      <p>Explore our comprehensive guides and tutorials to enhance your skills.</p>
    </header>
    <div className="articles">
      <article>
        <h2>Getting Started with Our Tools</h2>
        <p>Learn how to make the most of our features with this step-by-step guide.</p>
        {/* Ensure this link points to an existing page or remove it */}
        {/* <a href="/guide" title="Read more about getting started with our tools">Read More</a> */}
      </article>
      <article>
        <h2>Advanced Techniques</h2>
        <p>Take your skills to the next level with our advanced tutorials.</p>
        {/* Ensure this link points to an existing page or remove it */}
        {/* <a href="/advanced" title="Read more about advanced techniques">Read More</a> */}
      </article>
    </div>
  </section>
);

export default TopContent;