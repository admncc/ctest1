import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

export default function JobCard({ job }) {
  const budget = job.budget_min || job.budget_max
    ? `${job.budget_min ? job.budget_min + '€' : ''}${job.budget_min && job.budget_max ? ' – ' : ''}${job.budget_max ? job.budget_max + '€' : ''}`
    : 'Preis offen';

  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className="job-card-category">
        {job.category_icon} {job.category_name || 'Sonstiges'}
      </div>
      <div className="job-card-title">{job.title}</div>
      <div className="job-card-desc">{job.description}</div>
      <div className="job-card-meta">
        <div style={{ display: 'flex', gap: '12px' }}>
          <span className="job-card-meta-item">📍 {job.location}</span>
          <span className="job-card-meta-item">💰 {budget}</span>
          {job.bid_count !== undefined && (
            <span className="job-card-meta-item">💬 {job.bid_count} Angebote</span>
          )}
        </div>
        <span className={`badge badge-${job.status}`}>{STATUS_LABELS[job.status]}</span>
      </div>
    </Link>
  );
}
