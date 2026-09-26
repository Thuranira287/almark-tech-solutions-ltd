import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { portfolioProjects } from '@/data/portfolioProjects';
import PageHead from '@/components/PageHead';

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <PageHead path="/portfolio" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">Our Work</h1>
          <p className="text-lg text-gray-600">
            Real projects we've built — some live today, others built and awaiting launch
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioProjects.map((project) => {
            const CardInner = (
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={`${project.name} logo`}
                        width="48"
                        height="48"
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-brand-dark flex items-center justify-center text-brand-gold font-bold flex-shrink-0">
                        {project.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-brand-dark leading-tight">{project.name}</h3>
                      <p className="text-xs text-gray-500">{project.tagline}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 flex-1 mb-4">{project.description}</p>

                  <span className="text-xs text-gray-400">{project.category}</span>

                  {project.url && (
                    <div className="mt-3 flex items-center text-brand-gold text-sm font-medium">
                      Visit site <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );

            return project.url ? (
              <a
                key={project.name}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {CardInner}
              </a>
            ) : (
              <div key={project.name}>{CardInner}</div>
            );
          })}
        </div>

        <Card className="mt-10 bg-brand-dark text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-200">
              Want something like one of these built for you?{' '}
              <Link to="/quote" className="text-brand-gold hover:underline">Get a quote</Link>
              {' '}or{' '}
              <Link to="/contact" className="text-brand-gold hover:underline">reach out</Link>.
              {' '}Worked with us before?{' '}
              <Link to="/testimonials" className="text-brand-gold hover:underline">Leave a review</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
