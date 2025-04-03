 // Process Class
        class Process {
            constructor(id, arrivalTime, burstTime, priority = 1) {
                this.id = id;
                this.arrivalTime = arrivalTime;
                this.burstTime = burstTime;
                this.priority = priority;
                this.remainingTime = burstTime;
                this.finishTime = null;
                this.startTime = null;
                this.waitingTime = 0;
                this.turnaroundTime = 0;
                this.lastExecutionTime = 0;
            }

            reset() {
                this.remainingTime = this.burstTime;
                this.finishTime = null;
                this.startTime = null;
                this.waitingTime = 0;
                this.turnaroundTime = 0;
                this.lastExecutionTime = 0;
            }
        }

        // Scheduler Class
        class Scheduler {
            constructor() {
                this.processes = [];
                this.algorithm = 'fcfs';
                this.timeQuantum = 2;
                this.colors = [
                    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', 
                    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E',
                    '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC'
                ];
            }

            setAlgorithm(algorithm) {
                this.algorithm = algorithm;
            }

            setTimeQuantum(quantum) {
                this.timeQuantum = quantum;
            }

            addProcess(process) {
                this.processes.push(process);
            }

            removeProcess(processId) {
                this.processes = this.processes.filter(p => p.id !== processId);
            }

            clearProcesses() {
                this.processes = [];
            }

            resetProcesses() {
                this.processes.forEach(p => p.reset());
            }

            runSimulation() {
                this.resetProcesses();
                
                switch (this.algorithm) {
                    case 'fcfs':
                        return this.runFCFS();
                    case 'sjf':
                        return this.runSJF();
                    case 'srtf':
                        return this.runSRTF();
                    case 'rr':
                        return this.runRoundRobin();
                    case 'priority':
                        return this.runPriority();
                    default:
                        return this.runFCFS();
                }
            }

            // First Come First Served Algorithm
            runFCFS() {
                const processes = [...this.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
                let currentTime = 0;
                let ganttChart = [];
                
                processes.forEach(process => {
                    // Add idle time if needed
                    if (currentTime < process.arrivalTime) {
                        ganttChart.push({
                            processId: 'idle',
                            start: currentTime,
                            end: process.arrivalTime,
                            type: 'idle'
                        });
                        currentTime = process.arrivalTime;
                    }
                    
                    // Process execution
                    process.startTime = currentTime;
                    process.finishTime = currentTime + process.burstTime;
                    process.turnaroundTime = process.finishTime - process.arrivalTime;
                    process.waitingTime = process.turnaroundTime - process.burstTime;
                    
                    ganttChart.push({
                        processId: process.id,
                        start: currentTime,
                        end: process.finishTime,
                        type: 'execution'
                    });
                    
                    currentTime = process.finishTime;
                });
                
                return this.calculateResults(processes, ganttChart, currentTime);
            }

            // Shortest Job First (Non-preemptive)
            runSJF() {
                const processes = [...this.processes];
                let currentTime = 0;
                let ganttChart = [];
                let completedProcesses = [];
                
                while (completedProcesses.length < processes.length) {
                    // Find ready processes
                    const readyProcesses = processes.filter(p => 
                        p.arrivalTime <= currentTime && p.finishTime === null
                    );
                    
                    if (readyProcesses.length === 0) {
                        // No processes ready, advance time to next arrival
                        const nextArrival = processes
                            .filter(p => p.arrivalTime > currentTime)
                            .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
                        
                        ganttChart.push({
                            processId: 'idle',
                            start: currentTime,
                            end: nextArrival.arrivalTime,
                            type: 'idle'
                        });
                        
                        currentTime = nextArrival.arrivalTime;
                        continue;
                    }
                    
                    // Find shortest job
                    const shortestJob = readyProcesses.sort((a, b) => a.burstTime - b.burstTime)[0];
                    
                    // Process execution
                    if (shortestJob.startTime === null) {
                        shortestJob.startTime = currentTime;
                    }
                    
                    shortestJob.finishTime = currentTime + shortestJob.burstTime;
                    shortestJob.turnaroundTime = shortestJob.finishTime - shortestJob.arrivalTime;
                    shortestJob.waitingTime = shortestJob.turnaroundTime - shortestJob.burstTime;
                    
                    ganttChart.push({
                        processId: shortestJob.id,
                        start: currentTime,
                        end: shortestJob.finishTime,
                        type: 'execution'
                    });
                    
                    currentTime = shortestJob.finishTime;
                    completedProcesses.push(shortestJob);
                }
                
                return this.calculateResults(processes, ganttChart, currentTime);
            }

            // Shortest Remaining Time First (Preemptive)
            runSRTF() {
                const processes = [...this.processes];
                let currentTime = 0;
                let ganttChart = [];
                let completedProcesses = [];
                let lastProcess = null;
                
                // Initialize remaining times
                processes.forEach(p => p.remainingTime = p.burstTime);
                
                while (completedProcesses.length < processes.length) {
                    // Find ready processes
                    const readyProcesses = processes.filter(p => 
                        p.arrivalTime <= currentTime && p.finishTime === null
                    );
                    
                    if (readyProcesses.length === 0) {
                        // No processes ready, advance time to next arrival
                        const nextArrival = processes
                            .filter(p => p.arrivalTime > currentTime)
                            .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
                        
                        ganttChart.push({
                            processId: 'idle',
                            start: currentTime,
                            end: nextArrival.arrivalTime,
                            type: 'idle'
                        });
                        
                        currentTime = nextArrival.arrivalTime;
                        lastProcess = null;
                        continue;
                    }
                    
                    // Find process with shortest remaining time
                    const shortestProcess = readyProcesses.sort((a, b) => 
                        a.remainingTime - b.remainingTime
                    )[0];
                    
                    // If this is a new process starting or a context switch
                    if (lastProcess !== shortestProcess) {
                        if (lastProcess !== null) {
                            // Add current execution block to chart
                            ganttChart.push({
                                processId: lastProcess.id,
                                start: lastProcess.lastExecutionTime,
                                end: currentTime,
                                type: 'execution'
                            });
                        }
                        
                        // Update start time if this is the first execution
                        if (shortestProcess.startTime === null) {
                            shortestProcess.startTime = currentTime;
                        }
                        
                        // Update last execution time
                        shortestProcess.lastExecutionTime = currentTime;
                        lastProcess = shortestProcess;
                    }
                    
                    // Find next event time (next arrival or completion)
                    let nextEventTime = currentTime + shortestProcess.remainingTime;
                    
                    // Check if a new process arrives before this one completes
                    const nextArrival = processes.filter(p => p.arrivalTime > currentTime)
                        .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
                    
                    if (nextArrival && nextArrival.arrivalTime < nextEventTime) {
                        nextEventTime = nextArrival.arrivalTime;
                    }
                    
                    // Update remaining time
                    const timeUsed = nextEventTime - currentTime;
                    shortestProcess.remainingTime -= timeUsed;
                    
                    // Check if process completed
                    if (shortestProcess.remainingTime === 0) {
                        shortestProcess.finishTime = nextEventTime;
                        shortestProcess.turnaroundTime = shortestProcess.finishTime - shortestProcess.arrivalTime;
                        shortestProcess.waitingTime = shortestProcess.turnaroundTime - shortestProcess.burstTime;
                        completedProcesses.push(shortestProcess);
                    }
                    
                    currentTime = nextEventTime;
                }
                
                // Add final execution block if needed
                if (lastProcess !== null && lastProcess.lastExecutionTime < currentTime) {
                    ganttChart.push({
                        processId: lastProcess.id,
                        start: lastProcess.lastExecutionTime,
                        end: currentTime,
                        type: 'execution'
                    });
                }
                
                return this.calculateResults(processes, ganttChart, currentTime);
            }

            // Round Robin Algorithm
            runRoundRobin() {
                const processes = [...this.processes];
                let currentTime = 0;
                let ganttChart = [];
                let queue = [];
                let completedProcesses = [];
                let lastProcess = null;
                
                // Initialize remaining times
                processes.forEach(p => {
                    p.remainingTime = p.burstTime;
                    p.lastExecutionTime = currentTime;
                });
                
                while (completedProcesses.length < processes.length) {
                    // Add newly arrived processes to queue
                    const newArrivals = processes.filter(p => 
                        p.arrivalTime <= currentTime && 
                        p.finishTime === null && 
                        !queue.includes(p)
                    );
                    
                    queue.push(...newArrivals);
                    
                    if (queue.length === 0) {
                        // No processes in queue, advance time to next arrival
                        const nextArrival = processes
                            .filter(p => p.arrivalTime > currentTime && p.finishTime === null)
                            .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
                        
                        if (!nextArrival) break; // No more processes to execute
                        
                        ganttChart.push({
                            processId: 'idle',
                            start: currentTime,
                            end: nextArrival.arrivalTime,
                            type: 'idle'
                        });
                        
                        currentTime = nextArrival.arrivalTime;
                        continue;
                    }
                    
                    // Get process from front of queue
                    const currentProcess = queue.shift();
                    
                    // If this is a context switch
                    if (lastProcess !== currentProcess && lastProcess !== null) {
                        ganttChart.push({
                            processId: lastProcess.id,
                            start: lastProcess.lastExecutionTime,
                            end: currentTime,
                            type: 'execution'
                        });
                    }
                    
                    // Update start time if first execution
                    if (currentProcess.startTime === null) {
                        currentProcess.startTime = currentTime;
                    }
                    
                    // Update last execution time
                    currentProcess.lastExecutionTime = currentTime;
                    lastProcess = currentProcess;
                    
                    // Calculate execution time
                    const executionTime = Math.min(this.timeQuantum, currentProcess.remainingTime);
                    
                    // Update process state
                    currentProcess.remainingTime -= executionTime;
                    currentTime += executionTime;
                    
                    // Check for new arrivals during this time quantum
                    processes.forEach(p => {
                        if (p.arrivalTime > currentTime - executionTime && 
                            p.arrivalTime <= currentTime && 
                            p.finishTime === null && 
                            !queue.includes(p)) {
                            queue.push(p);
                        }
                    });
                    
                    // Check if process completed
                    if (currentProcess.remainingTime === 0) {
                        currentProcess.finishTime = currentTime;
                        currentProcess.turnaroundTime = currentProcess.finishTime - currentProcess.arrivalTime;
                        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                        completedProcesses.push(currentProcess);
                        
                        // Add to Gantt chart
                        ganttChart.push({
                            processId: currentProcess.id,
                            start: currentProcess.lastExecutionTime,
                            end: currentTime,
                            type: 'execution'
                        });
                        
                        lastProcess = null;
                    } else {
                        // Process not completed, add back to queue
                        queue.push(currentProcess);
                    }
                }
                
                // Add final execution block if needed
                if (lastProcess !== null && lastProcess.lastExecutionTime < currentTime) {
                    ganttChart.push({
                        processId: lastProcess.id,
                        start: lastProcess.lastExecutionTime,
                        end: currentTime,
                        type: 'execution'
                    });
                }
                
                return this.calculateResults(processes, ganttChart, currentTime);
            }

            // Priority Scheduling (Non-preemptive)
            runPriority() {
                const processes = [...this.processes];
                let currentTime = 0;
                let ganttChart = [];
                let completedProcesses = [];
                
                while (completedProcesses.length < processes.length) {
                    // Find ready processes
                    const readyProcesses = processes.filter(p => 
                        p.arrivalTime <= currentTime && p.finishTime === null
                    );
                    
                    if (readyProcesses.length === 0) {
                        // No processes ready, advance time to next arrival
                        const nextArrival = processes
                            .filter(p => p.arrivalTime > currentTime)
                            .sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
                        
                        ganttChart.push({
                            processId: 'idle',
                            start: currentTime,
                            end: nextArrival.arrivalTime,
                            type: 'idle'
                        });
                        
                        currentTime = nextArrival.arrivalTime;
                        continue;
                    }
                    
                    // Find highest priority job (lower number = higher priority)
                    const highestPriorityJob = readyProcesses.sort((a, b) => a.priority - b.priority)[0];
                    
                    // Process execution
                    if (highestPriorityJob.startTime === null) {
                        highestPriorityJob.startTime = currentTime;
                    }
                    
                    highestPriorityJob.finishTime = currentTime + highestPriorityJob.burstTime;
                    highestPriorityJob.turnaroundTime = highestPriorityJob.finishTime - highestPriorityJob.arrivalTime;
                    highestPriorityJob.waitingTime = highestPriorityJob.turnaroundTime - highestPriorityJob.burstTime;
                    
                    ganttChart.push({
                        processId: highestPriorityJob.id,
                        start: currentTime,
                        end: highestPriorityJob.finishTime,
                        type: 'execution'
                    });
                    
                    currentTime = highestPriorityJob.finishTime;
                    completedProcesses.push(highestPriorityJob);
                }
                
                return this.calculateResults(processes, ganttChart, currentTime);
            }

            // Calculate final results
            calculateResults(processes, ganttChart, totalTime) {
                // Calculate average metrics
                const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
                const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
                const averageTurnaroundTime = totalTurnaroundTime / processes.length;
                const averageWaitingTime = totalWaitingTime / processes.length;
                
                // Calculate CPU utilization
                const idleTime = ganttChart
                    .filter(block => block.type === 'idle')
                    .reduce((sum, block) => sum + (block.end - block.start), 0);
                
                const cpuUtilization = ((totalTime - idleTime) / totalTime) * 100;
                
                return {
                    processes: processes,
                    ganttChart: ganttChart,
                    metrics: {
                        averageTurnaroundTime,
                        averageWaitingTime,
                        cpuUtilization
                    }
                };
            }
        }

        // Wait for the DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Get DOM elements
            const algorithmSelect = document.getElementById('algorithm');
            const timeQuantumGroup = document.getElementById('quantum-group');
            const timeQuantumInput = document.getElementById('time-quantum');
            const priorityGroup = document.getElementById('priority-group');
            const arrivalTimeInput = document.getElementById('arrival-time');
            const burstTimeInput = document.getElementById('burst-time');
            const priorityInput = document.getElementById('priority');
            const addProcessBtn = document.getElementById('add-process');
            const clearProcessesBtn = document.getElementById('clear-processes');
            const runSimulationBtn = document.getElementById('run-simulation');
            const processTableBody = document.getElementById('process-body');
            const resultsSection = document.getElementById('results');
            const ganttChartDiv = document.getElementById('gantt-chart');
            const avgTurnaroundSpan = document.getElementById('avg-turnaround');
            const avgWaitingSpan = document.getElementById('avg-waiting');
            const cpuUtilizationSpan = document.getElementById('cpu-utilization');
            const processDetailsBody = document.getElementById('details-body');

            // Initialize scheduler
            const scheduler = new Scheduler();
            let nextProcessId = 1;

            // Show/hide time quantum input based on selected algorithm
            algorithmSelect.addEventListener('change', function() {
                timeQuantumGroup.style.display = this.value === 'rr' ? 'block' : 'none';
                priorityGroup.style.display = this.value === 'priority' ? 'block' : 'none';
                scheduler.setAlgorithm(this.value);
            });

            // Add process to the scheduler
            addProcessBtn.addEventListener('click', function() {
                const arrivalTime = parseInt(arrivalTimeInput.value);
                const burstTime = parseInt(burstTimeInput.value);
                const priority = parseInt(priorityInput.value) || 1;
                
                if (isNaN(arrivalTime) || isNaN(burstTime) || burstTime <= 0) {
                    alert('Please enter valid arrival and burst times.');
                    return;
                }
                
                const process = new Process(nextProcessId, arrivalTime, burstTime, priority);
                scheduler.addProcess(process);
                
                // Add process to the table
                const row = document.createElement('tr');
                row.dataset.processId = process.id;
                row.innerHTML = `
                    <td>P${process.id}</td>
                    <td>${process.arrivalTime}</td>
                    <td>${process.burstTime}</td>
                    <td>${process.priority}</td>
                    <td><button class="btn btn-danger btn-sm delete-process">Remove</button></td>
                `;
                processTableBody.appendChild(row);
                
                // Increment process ID for next addition
                nextProcessId++;
                
                // Reset input fields
                arrivalTimeInput.value = '';
                burstTimeInput.value = '';
                priorityInput.value = '1';
                arrivalTimeInput.focus();
            });
            
            // Remove process from the scheduler
            processTableBody.addEventListener('click', function(e) {
                if (e.target.classList.contains('delete-process')) {
                    const row = e.target.closest('tr');
                    const processId = parseInt(row.dataset.processId);
                    
                    scheduler.removeProcess(processId);
                    row.remove();
                }
            });
            
            // Clear all processes
            clearProcessesBtn.addEventListener('click', function() {
                scheduler.clearProcesses();
                processTableBody.innerHTML = '';
                resultsSection.style.display = 'none';
            });
            
            // Set time quantum for Round Robin
            timeQuantumInput.addEventListener('change', function() {
                const quantum = parseInt(this.value);
                if (!isNaN(quantum) && quantum > 0) {
                    scheduler.setTimeQuantum(quantum);
                }
            });
            
            // Run simulation
            runSimulationBtn.addEventListener('click', function() {
                if (scheduler.processes.length === 0) {
                    alert('Please add at least one process.');
                    return;
                }
                
                // Run algorithm and get results
                const results = scheduler.runSimulation();
                
                // Display results
                resultsSection.style.display = 'block';
                
                // Update metrics
                avgTurnaroundSpan.textContent = results.metrics.averageTurnaroundTime.toFixed(2);
                avgWaitingSpan.textContent = results.metrics.averageWaitingTime.toFixed(2);
                cpuUtilizationSpan.textContent = results.metrics.cpuUtilization.toFixed(2) + '%';
                
                // Display process details
                processDetailsBody.innerHTML = '';
                results.processes.forEach(p => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>P${p.id}</td>
                        <td>${p.arrivalTime}</td>
                        <td>${p.burstTime}</td>
                        <td>${p.startTime}</td>
                        <td>${p.finishTime}</td>
                        <td>${p.turnaroundTime}</td>
                        <td>${p.waitingTime}</td>
                    `;
                    processDetailsBody.appendChild(row);
                });
                
                // Create Gantt chart
                createGanttChart(results.ganttChart, scheduler.colors);
            });
            
            // Function to create Gantt chart
            function createGanttChart(ganttChart, colors) {
                // Clear previous chart
                ganttChartDiv.innerHTML = '';
                
                if (ganttChart.length === 0) return;
                
                // Find total time (end of last block)
                const totalTime = Math.max(...ganttChart.map(block => block.end));
                
                // Create chart container
                const chartContainer = document.createElement('div');
                chartContainer.className = 'gantt-container';
                
                // Create time axis
                const timeAxis = document.createElement('div');
                timeAxis.className = 'time-axis';
                
                // Create blocks container
                const blocksContainer = document.createElement('div');
                blocksContainer.className = 'gantt-blocks';
                
                // Process each block in gantt chart
                ganttChart.forEach((block, index) => {
                    const width = ((block.end - block.start) / totalTime) * 100;
                    
                    // Skip very small blocks
                    if (width < 0.5) return;
                    
                    const ganttBlock = document.createElement('div');
                    ganttBlock.className = 'gantt-block';
                    ganttBlock.style.width = `${width}%`;
                    
                    if (block.processId === 'idle') {
                        ganttBlock.classList.add('idle-block');
                        ganttBlock.textContent = 'Idle';
                    } else {
                        const colorIndex = (parseInt(block.processId) - 1) % colors.length;
                        ganttBlock.style.backgroundColor = colors[colorIndex];
                        ganttBlock.textContent = `P${block.processId}`;
                    }
                    
                    // Add tooltip
                    ganttBlock.title = `Process: ${block.processId === 'idle' ? 'Idle' : 'P' + block.processId}
Time: ${block.start} - ${block.end}
Duration: ${block.end - block.start}`;
                    
                    blocksContainer.appendChild(ganttBlock);
                });
                
                // Add time markers
                const timeStep = Math.ceil(totalTime / 10); // Show at most 10 time markers
                for (let t = 0; t <= totalTime; t += timeStep) {
                    const marker = document.createElement('span');
                    marker.className = 'time-marker';
                    marker.style.left = `${(t / totalTime) * 100}%`;
                    marker.textContent = t;
                    timeAxis.appendChild(marker);
                }
                
                // Assemble chart
                chartContainer.appendChild(blocksContainer);
                chartContainer.appendChild(timeAxis);
                ganttChartDiv.appendChild(chartContainer);
            }
            
            // Initialize UI
            timeQuantumGroup.style.display = 'none';
            priorityGroup.style.display = 'none';
            resultsSection.style.display = 'none';
        });
    