'use client';
import React from 'react';
import { Header } from '../components/Header';
import { MissionImageBlock } from '../components/MissionImageBlock';
import { ChevronRight } from 'lucide-react';
import { Story, Localization } from '../logic';

interface StoryViewProps {
  story: Story;
  loc: Localization;
  setView: (view: any) => void;
}

export const StoryView = ({ story, loc, setView }: StoryViewProps) => (
  <>
    <Header title={story.title} />
    <div className="my-6 px-4 md:px-10">
      <MissionImageBlock src={story.photo} isFullWidth={true} />
    </div>
    <div className="space-y-6 text-lg  leading-relaxed">
      <p className="bg-[#003300] p-4 border-l-8 border-[#00ff41]">{story.plot}</p>
      <div className="p-4 border border-[#00ff41] border-dashed">
        <h3 className="font-bold mb-2">{loc.lb_protocol}:</h3>
        <ul className="list-disc list-inside text-sm space-y-1 opacity-80">
          <li>{loc.lb_instruct_1}</li>
          <li>{loc.lb_instruct_2}</li>
        </ul>
      </div>
      <button
        onClick={() => setView('game')}
        className="w-full flex items-center justify-center gap-4 border-2 border-[#00ff41] py-4 hover:bg-[#00ff41] hover:text-black font-bold uppercase">
        {loc.btn_start_game} <ChevronRight />
      </button>
    </div>
  </>
);
