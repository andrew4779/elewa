import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { Chart } from 'chart.js/auto';
import { SubSink } from 'subsink';
import { Observable, combineLatest, switchMap } from 'rxjs';

import { ProgressMonitoringService } from '@app/state/convs-mgr/monitoring';
import { BotModulesStateService } from '@app/state/convs-mgr/modules'
import { BotsStateService } from '@app/state/convs-mgr/bots';
import { ClassroomService } from '@app/state/convs-mgr/classrooms';

import { Bot } from '@app/model/convs-mgr/bots';
import { BotModule } from '@app/model/convs-mgr/bot-modules';
import { Classroom } from '@app/model/convs-mgr/classroom';
import { GroupProgressModel, Periodicals } from '@app/model/analytics/group-based/progress';


import { 
  formatDate, 
  getColor, 
  getDailyProgress, 
  getWeeklyProgress,
  getMonthlyProgress, 
  getLabels
} from '../../providers/helper-fns.util';

@Component({
  selector: 'app-group-based-progress-chart',
  templateUrl: './group-based-progress-chart.component.html',
  styleUrls: ['./group-based-progress-chart.component.scss'],
})
export class GroupBasedProgressChartComponent implements OnInit, OnDestroy {
  @Input() chart: Chart;

  @Input() progress$: Observable<{scopedProgress: GroupProgressModel[], allProgress: GroupProgressModel[]}>;
  @Input() period$: Observable<Periodicals>;
  @Input() isLast$: Observable<boolean>;

  private _sBs = new SubSink();

  courses: Bot[];
  classrooms: Classroom[];
  botModules: BotModule[];

  activeCourse: Bot;
  activeClassroom: Classroom;
  selectedPeriodical: Periodicals;

  showData = false;

  dailyProgress: GroupProgressModel[]; 
  weeklyProgress: GroupProgressModel[];
  monthlyProgress: GroupProgressModel[];

  currentProgress: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderRadius: number;
  }[];

  @Input()
  set setActiveCourse(value: Bot) {
    this.activeCourse = value
  }

  @Input()
  set setActiveClassroom(value: Classroom) {
    this.activeClassroom = value
  }

  constructor (
    private _progressService: ProgressMonitoringService,
    private _clasroomServ$: ClassroomService,
    private _botModServ$: BotModulesStateService,
    private _botServ$: BotsStateService
  ) {}

  ngOnInit() {
    const dataLayer$ = this.initDataLayer();

    this._sBs.sink = combineLatest([dataLayer$, this.period$, this.progress$, this.isLast$])
      .subscribe(([botModules, period, progress, isLast]) => {
        this.botModules = botModules;
        if (progress.scopedProgress.length) {
          this.selectedPeriodical = period;

          if(progress.scopedProgress.length > 0) {
            this.showData = true;
          } else {
            this.showData = false;
          }

          this.currentProgress = this.getDatasets(progress.allProgress);

          this.chart = this._loadChart(progress.scopedProgress, isLast);
        }
      });
  }

  /** initialise the data layer (fetch bots, modules and classrooms) */
  initDataLayer() {
    return this._botServ$.getBots().pipe(
      switchMap(bots => {
        this.courses = bots

        return this._clasroomServ$.getAllClassrooms().pipe(
          switchMap(clsrooms => {
          this.classrooms = clsrooms;
          return this._botModServ$.getBotModules()
        }))
      })
    )
  }


  // /** select progress tracking Periodicals */
  // selectProgressTracking(periodical: Periodicals) {
  //   if (!this.dailyProgress) return //return if there's no progress to visualise (avoid chart js errors)


  //   if (periodical === 'Daily') {
  //     this.chart = this._loadChart(this.dailyProgress);
  //   } else if (periodical === 'Weekly') {
  //     this.chart = this._loadChart(this.weeklyProgress);
  //   } else {
  //     this.chart = this._loadChart(this.monthlyProgress);
  //   }
  // }

  /** draw chart. */
  private _loadChart(model: GroupProgressModel[], isLast: boolean): Chart {
    if (this.chart) {
      this.chart.destroy();
    }

    return new Chart('chart-ctx', {
      type: 'bar',
      data: {
        labels: getLabels(model, this.selectedPeriodical, isLast),
        datasets: this.getDatasets(model),
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        normalized: true,
        plugins: {
          title: {
            display: true,
            text: 'Course progression',
          },
          legend: {
            display: true,
            position: "bottom",
            labels: {
              boxWidth: 12,
              useBorderRadius: true,
              borderRadius: 6
            },
          },
        },
        scales: {
          x: { 
            stacked: true, 
            grid: {display: false} ,
            ticks: { 
              maxTicksLimit: 12,
              autoSkip: false
            },
          },
          y: { 
            stacked: true, 
            grid: {color: '#F0F0F0'},  
            ticks: { 
              maxTicksLimit: 6, 
              autoSkip: true 
            }},
        },
      },
    });
  }

  /** returns a dataset for visualisation */
  private getDatasets(model: GroupProgressModel[]) {
    const bot = this.courses.find(course => course.id === this.activeCourse.id) as Bot;

    // if AllCourses is selected we group with the course as our reference point.
    if (!bot) {
      return this.courses.map((bot, idx) => {
        return {
          label: bot.name,
          data: this.unpackAllBots(model, bot),
          backgroundColor: getColor(idx),
          borderRadius: 10,
        };
      })
    }

    // if a specific course is selected we group with the modules as our reference point.
    else {
      return bot.modules.map((botMod, idx) => {
        const botMilestone = this.botModules.find(mod => mod.id === botMod) as BotModule;

        return this.unpackAtModuleLevel(
          botMilestone,
          idx,
          model
        )
      });
    }
  }

  /** unpack/ungroup data when all courses is selected */
  private unpackAllBots(model: GroupProgressModel[], bot:Bot) {
    return model.map((item) => {
      const participants = item.measurements.find((m) => m.id === bot.id)?.participants;

      if (this.activeClassroom.className === 'All') {
        return participants?.length ?? 0;
      } else {
        return participants?.filter((part) => part.classroom.id === this.activeClassroom.id).length ?? 0;
      }
    })
  };

  /** unpack data at the module level */
  private unpackAtModuleLevel(milestone: BotModule, idx: number, model: GroupProgressModel[]) {
    return {
      label: milestone?.name,
      data: this.getData(milestone, model),
      backgroundColor: getColor(idx),
      borderRadius: 10
    };
  }

  /** get data while unpacking at the module level */
  private getData(moduleMilestone: BotModule, model: GroupProgressModel[]): number[] {
    // return moduleMilestone data from users of the active course and class === selected tab
    const data = model.map(
      (item) => {
        if (this.activeClassroom.className === 'All') {
          const courseGroup = item.groupedMeasurements.find((course) => course?.id === this.activeCourse.id);
          const measurements = courseGroup?.classrooms.flatMap(clsroom => clsroom?.measurements?.filter((botMod) => botMod?.id === moduleMilestone?.id));
          const participantCount = measurements?.reduce((acc, clsroom) => acc + (clsroom?.participants?.length ?? 0), 0) ?? 0;
          
          return participantCount;
        } else {
          const courseGroup = item.groupedMeasurements.find((course) => course?.id === this.activeCourse.id);
          const classGroup = courseGroup?.classrooms.find((cls) => cls?.id === this.activeClassroom.id);
          const participantCount = classGroup?.measurements?.find((botMod) => botMod?.id === moduleMilestone?.id)?.participants.length ?? 0

          return participantCount;
        }
      }
    );

    // Get current daily progress for monthly and weekly
    if (this.selectedPeriodical !== 'Daily') {
      const md = this.currentProgress?.find(((modProgress)=> modProgress.label === moduleMilestone.name))

      if (md) {
        // Push only the current day's progress 
        data.push(md.data[md.data.length -1])
      }
    }
    
    return data
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }

    this._sBs.unsubscribe();
  }
}
