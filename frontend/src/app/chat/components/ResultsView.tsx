"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getFoundationScores } from "../services/api";
import { ErrorState } from "./ErrorState";
import { FoundationsLoader } from "./FoundationsLoader";
import { EmptyState } from "./EmptyState";

type MatchItem = {
  text: string;
  type: "fit" | "mismatch" | "question";
};

type RequiredDocument = {
  document_type: string;
  description: string;
  required: boolean;
};

type ApplicationProcess = {
  deadline_type: string;
  deadline_date?: string;
  rolling_info?: string;
  required_documents: RequiredDocument[];
  evaluation_process: string;
  decision_timeline: string;
};

type GeographicArea = {
  scope: string;
  specific_areas: string[];
  restrictions?: string;
};

type FundingAmount = {
  category: string;
  min_amount: number;
  max_amount: number;
  average_amount?: number;
  total_budget?: number;
};

type ContactInfo = {
  email: string;
  phone?: string;
  address?: string;
  contact_person?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  foundation_id: string;
  funded_amount: number;
  duration: {
    start_date: string;
    end_date?: string;
    duration_months: number;
  };
  status: string;
  outcomes?: string;
  website_url?: string;
};

type Foundation = {
  id: string;
  name: string;
  logo: string;
  purpose: string;
  description: string;
  fundingAmount: string;
  matches: MatchItem[];
  // Full foundation details
  matchScore?: number;
  longDescription?: string;
  legalForm?: string;
  gemeinnuetzigeZwecke?: string[];
  antragsprozess?: ApplicationProcess;
  foerderbereich?: GeographicArea;
  foerderhoehe?: FundingAmount;
  contact?: ContactInfo;
  pastProjects?: Project[];
  website?: string;
};

const MatchIcon = ({ type }: { type: MatchItem["type"] }) => {
  if (type === "fit") {
    return (
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === "mismatch") {
    return (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
};

const FoundationCard = ({ 
  foundation,
  isExpanded,
  onToggleExpand
}: { 
  foundation: Foundation;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const fits = foundation.matches.filter((m) => m.type === "fit");
  const mismatches = foundation.matches.filter((m) => m.type === "mismatch");
  const questions = foundation.matches.filter((m) => m.type === "question");

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-500 p-6 ${
      isExpanded ? '' : 'mb-4'
    } animate-fadeIn`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-[#1b98d5] to-[#0065bd] p-2">
          <Image src={foundation.logo} alt={foundation.name} width={64} height={64} className="w-full h-full" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{foundation.name}</h3>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {foundation.purpose}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-6 py-3 bg-white/30 backdrop-blur-sm text-gray-900 text-xl font-bold rounded-lg border border-white/50">
            {foundation.fundingAmount}
          </div>
          {!isExpanded && (
            <button
              onClick={onToggleExpand}
              className="text-sm text-gray-600 hover:text-[#1b98d5] transition-colors"
            >
              Details ansehen →
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={`text-gray-600 text-sm mb-4 ${isExpanded ? '' : 'line-clamp-2'}`}>
        {foundation.description}
      </p>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6 animate-fadeIn">
          {/* Additional Details Section */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Detaillierte Informationen</h4>
            <div className="space-y-4">
              {/* Match Score */}
              {foundation.matchScore !== undefined && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Match Score</h5>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${foundation.matchScore * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {Math.round(foundation.matchScore * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Legal Form & Scope */}
              <div className="grid grid-cols-2 gap-4">
                {foundation.legalForm && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Rechtsform</h5>
                    <p className="text-gray-600">{foundation.legalForm}</p>
                  </div>
                )}
                {foundation.foerderbereich && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Förderbereich</h5>
                    <p className="text-gray-600 capitalize">{foundation.foerderbereich.scope}</p>
                    {foundation.foerderbereich.specific_areas && foundation.foerderbereich.specific_areas.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {foundation.foerderbereich.specific_areas.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Long Description */}
              {foundation.longDescription && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Über die Stiftung</h5>
                  <p className="text-gray-600 text-sm">{foundation.longDescription}</p>
                </div>
              )}

              {/* Gemeinnützige Zwecke */}
              {foundation.gemeinnuetzigeZwecke && foundation.gemeinnuetzigeZwecke.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Gemeinnützige Zwecke</h5>
                  <div className="flex flex-wrap gap-2">
                    {foundation.gemeinnuetzigeZwecke.map((zweck, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {zweck}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Förderhöhe Details */}
              {foundation.foerderhoehe && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Förderhöhe</h5>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kategorie:</span>
                      <span className="font-medium capitalize">{foundation.foerderhoehe.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bereich:</span>
                      <span className="font-medium">
                        {foundation.foerderhoehe.min_amount.toLocaleString('de-DE')}€ - {foundation.foerderhoehe.max_amount.toLocaleString('de-DE')}€
                      </span>
                    </div>
                    {foundation.foerderhoehe.average_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durchschnitt:</span>
                        <span className="font-medium">{foundation.foerderhoehe.average_amount.toLocaleString('de-DE')}€</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Antragsprozess - The key section the user wanted */}
              {foundation.antragsprozess && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Antragsprozess</h5>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    {/* Deadline */}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Bewerbungsfrist:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {foundation.antragsprozess.deadline_type === "fixed" ? (
                          <>Fester Termin: {foundation.antragsprozess.deadline_date}</>
                        ) : (
                          <>Laufende Bewerbung - {foundation.antragsprozess.rolling_info}</>
                        )}
                      </p>
                    </div>

                    {/* Required Documents */}
                    {foundation.antragsprozess.required_documents && foundation.antragsprozess.required_documents.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Erforderliche Unterlagen:</span>
                        <ul className="mt-2 space-y-1">
                          {foundation.antragsprozess.required_documents.map((doc, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className={doc.required ? "text-red-500" : "text-gray-400"}>
                                {doc.required ? "•" : "○"}
                              </span>
                              <span>
                                <strong>{doc.document_type}:</strong> {doc.description}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Evaluation Process */}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Bewertungsprozess:</span>
                      <p className="text-sm text-gray-600 mt-1">{foundation.antragsprozess.evaluation_process}</p>
                    </div>

                    {/* Decision Timeline */}
                    <div>
                      <span className="text-sm font-medium text-gray-700">Entscheidungszeitraum:</span>
                      <p className="text-sm text-gray-600 mt-1">{foundation.antragsprozess.decision_timeline}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {foundation.contact && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Kontakt</h5>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    {foundation.contact.contact_person && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600">Ansprechpartner:</span>
                        <span className="font-medium">{foundation.contact.contact_person}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600">Email:</span>
                      <a href={`mailto:${foundation.contact.email}`} className="text-[#1b98d5] hover:underline">
                        {foundation.contact.email}
                      </a>
                    </div>
                    {foundation.contact.phone && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600">Telefon:</span>
                        <a href={`tel:${foundation.contact.phone}`} className="text-[#1b98d5] hover:underline">
                          {foundation.contact.phone}
                        </a>
                      </div>
                    )}
                    {foundation.contact.address && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600">Adresse:</span>
                        <span className="text-gray-600">{foundation.contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Website */}
              {foundation.website && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Weitere Informationen</h5>
                  <a 
                    href={foundation.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#1b98d5] hover:underline"
                  >
                    <span>Website besuchen</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Past Projects */}
              {foundation.pastProjects && foundation.pastProjects.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Vergangene Projekte</h5>
                  <div className="space-y-3">
                    {foundation.pastProjects.slice(0, 3).map((project, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <h6 className="font-medium text-gray-900 mb-1">{project.name}</h6>
                        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Förderung: {project.funded_amount.toLocaleString('de-DE')}€</span>
                          <span>Status: {project.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={onToggleExpand}
            className="w-full py-3 bg-[#1b98d5] text-white rounded-lg hover:bg-[#0065bd] transition-colors font-medium"
          >
            ← Zurück zur Übersicht
          </button>
        </div>
      )}

      {/* Match Analysis - Only show when NOT expanded */}
      {!isExpanded && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Match-Analyse</h4>
          <div className="grid grid-cols-3 gap-4">
            {/* Fits */}
            <div>
              <div className="text-xs font-medium text-green-700 mb-2">Passt</div>
              <div className="space-y-1">
                {fits.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <MatchIcon type="fit" />
                    <span className="text-xs text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mismatches */}
            <div>
              <div className="text-xs font-medium text-red-700 mb-2">Achtung</div>
              <div className="space-y-1">
                {mismatches.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <MatchIcon type="mismatch" />
                    <span className="text-xs text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="text-xs font-medium text-yellow-700 mb-2">Zu klären</div>
              <div className="space-y-1">
                {questions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <MatchIcon type="question" />
                    <span className="text-xs text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function ResultsView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real data from backend
    const fetchFoundations = async () => {
      try {
        const response = await getFoundationScores(undefined, 5);
        
        if (response && response.success && response.foundations) {
          // Map backend data to frontend Foundation type
          const mappedFoundations: Foundation[] = response.foundations.map((f: any) => ({
            id: f.id,
            name: f.name,
            logo: f.logo,
            purpose: f.purpose,
            description: f.description,
            fundingAmount: f.funding_amount,
            matches: f.matches,
            // Store all additional data for detail view
            matchScore: f.match_score,
            longDescription: f.long_description,
            legalForm: f.legal_form,
            gemeinnuetzigeZwecke: f.gemeinnuetzige_zwecke,
            antragsprozess: f.antragsprozess,
            foerderbereich: f.foerderbereich,
            foerderhoehe: f.foerderhoehe,
            contact: f.contact,
            pastProjects: f.past_projects,
            website: f.website,
          }));
          
          setFoundations(mappedFoundations);
          console.log("✅ Loaded foundations from backend:", mappedFoundations);
        } else {
          setError("Backend ist nicht erreichbar. Bitte starte den Server.");
          console.warn("⚠️ Backend unavailable");
        }
      } catch (error) {
        console.error("❌ Error fetching foundations:", error);
        setError("Fehler beim Laden der Stiftungen. Bitte versuche es später erneut.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoundations();
  }, []);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isAnyExpanded = expandedId !== null;

  if (isLoading) {
    return <FoundationsLoader />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (foundations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      {/* Header - Hide when expanded */}
      {!isAnyExpanded && (
        <div className="mb-8 animate-slideDown">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dein Perfect Match: {foundations.length} Stiftungen gefunden
          </h1>
          <p className="text-gray-600">
            Basierend auf deiner Projektidee haben wir diese passenden Fördermöglichkeiten identifiziert.
          </p>
        </div>
      )}

      {/* Foundation Cards */}
      <div className={isAnyExpanded ? '' : 'space-y-4'}>
        {foundations.map((foundation, index) => {
          const isExpanded = expandedId === foundation.id;
          const shouldShow = !isAnyExpanded || isExpanded;
          
          if (!shouldShow) return null;

          return (
            <div
              key={foundation.id}
              style={{ animationDelay: isAnyExpanded ? '0ms' : `${index * 100}ms` }}
            >
              <FoundationCard 
                foundation={foundation} 
                isExpanded={isExpanded}
                onToggleExpand={() => handleToggleExpand(foundation.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}


