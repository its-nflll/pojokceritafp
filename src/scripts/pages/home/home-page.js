import HomePresenter from './home-presenter.js';

export default async function HomePage() {
  await HomePresenter.showStories();
}
