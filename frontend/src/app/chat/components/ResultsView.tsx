"use client";

import { useState } from "react";
import Image from "next/image";

type MatchItem = {
  text: string;
  type: "fit" | "mismatch" | "question";
};

type Foundation = {
  id: string;
  name: string;
  logo: string;
  purpose: string;
  description: string;
  fundingAmount: string;
  matches: MatchItem[];
};

const mockFoundations: Foundation[] = [
  {
    id: "1",
    name: "Bürgerstiftung München",
    logo: "/hero-avatar.svg",
    purpose: "Förderung der Jugendhilfe",
    description: "Unterstützt lokale Projekte zur Förderung von Kindern und Jugendlichen in München. Fokus auf Bildung und Integration.",
    fundingAmount: "Bis zu 50.000€",
    matches: [
      { text: "Fördert lokale Projekte", type: "fit" },
      { text: "Unterstützt Jugendinitiativen", type: "fit" },
      { text: "Keine Personalkosten", type: "mismatch" },
      { text: "Kofinanzierung nötig?", type: "question" },
    ],
  },
  {
    id: "2",
    name: "BMW Foundation",
    logo: "/hero-avatar.svg",
    purpose: "Förderung von Wissenschaft und Forschung",
    description: "Internationale Stiftung für soziale Innovation und nachhaltige Entwicklung mit Fokus auf Leadership-Programme.",
    fundingAmount: "Bis zu 100.000€",
    matches: [
      { text: "Internationale Reichweite", type: "fit" },
      { text: "Innovation & Technologie", type: "fit" },
      { text: "Bewerbungsprozess komplex", type: "mismatch" },
      { text: "Mehrjährige Förderung möglich?", type: "question" },
    ],
  },
  {
    id: "3",
    name: "Stiftung Bildungspakt Bayern",
    logo: "/hero-avatar.svg",
    purpose: "Förderung von Bildung und Erziehung",
    description: "Entwickelt innovative Bildungskonzepte für bayerische Schulen. Schwerpunkt auf digitaler Bildung und MINT-Förderung.",
    fundingAmount: "Bis zu 30.000€",
    matches: [
      { text: "Bildungsprojekte", type: "fit" },
      { text: "Bayern-Fokus", type: "fit" },
      { text: "Nur für Schulprojekte", type: "mismatch" },
      { text: "Projektlaufzeit flexibel?", type: "question" },
    ],
  },
  {
    id: "4",
    name: "Robert Bosch Stiftung",
    logo: "/hero-avatar.svg",
    purpose: "Förderung des bürgerschaftlichen Engagements",
    description: "Eine der größten unternehmensverbundenen Stiftungen in Deutschland. Fördert Gesundheit, Bildung und Völkerverständigung.",
    fundingAmount: "Bis zu 75.000€",
    matches: [
      { text: "Große Projektförderung", type: "fit" },
      { text: "Bundesweite Reichweite", type: "fit" },
      { text: "Hohe Konkurrenz", type: "mismatch" },
      { text: "Matching Funds erforderlich?", type: "question" },
    ],
  },
  {
    id: "5",
    name: "Stadtwerke München Bildungsstiftung",
    logo: "/hero-avatar.svg",
    purpose: "Förderung von Kunst und Kultur",
    description: "Unterstützt kulturelle und bildungsbezogene Projekte in München. Besonderer Fokus auf Nachhaltigkeit und Umweltbildung.",
    fundingAmount: "Bis zu 25.000€",
    matches: [
      { text: "München-Bezug", type: "fit" },
      { text: "Nachhaltigkeitsfokus", type: "fit" },
      { text: "Begrenzte Mittel", type: "mismatch" },
      { text: "Reporting-Aufwand?", type: "question" },
    ],
  },
];

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
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Förderschwerpunkte</h5>
                <p className="text-gray-600">
                  Diese Stiftung konzentriert sich auf nachhaltige Projekte mit sozialem Impact. 
                  Besondere Förderung erhalten innovative Ansätze im Bereich {foundation.purpose.toLowerCase()}.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Bewerbungsanforderungen</h5>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Detaillierter Projektplan</li>
                  <li>Kostenaufstellung</li>
                  <li>Nachweis der Gemeinnützigkeit</li>
                  <li>Referenzen ähnlicher Projekte</li>
                </ul>
              </div>
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

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isAnyExpanded = expandedId !== null;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      {/* Header - Hide when expanded */}
      {!isAnyExpanded && (
        <div className="mb-8 animate-slideDown">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dein Perfect Match: {mockFoundations.length} Stiftungen gefunden
          </h1>
          <p className="text-gray-600">
            Basierend auf deiner Projektidee haben wir diese passenden Fördermöglichkeiten identifiziert.
          </p>
        </div>
      )}

      {/* Foundation Cards */}
      <div className={isAnyExpanded ? '' : 'space-y-4'}>
        {mockFoundations.map((foundation, index) => {
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


