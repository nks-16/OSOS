/**
 * Banker's Algorithm Engine
 * Implements safety algorithm, resource allocation, and deadlock detection
 */

class BankersEngine {
  constructor(processes, resources, allocation, maxDemand, available) {
    this.processes = processes; // ['P0', 'P1', ...]
    this.resources = resources; // ['A', 'B', 'C', 'D']
    this.allocation = allocation; // 2D array
    this.maxDemand = maxDemand; // 2D array
    this.available = available; // 1D array
    this.need = this.calculateNeed();
  }

  calculateNeed() {
    const need = [];
    for (let i = 0; i < this.processes.length; i++) {
      need[i] = [];
      for (let j = 0; j < this.resources.length; j++) {
        need[i][j] = this.maxDemand[i][j] - this.allocation[i][j];
      }
    }
    return need;
  }

  // Check if request can be satisfied
  canSatisfyRequest(processIndex, request) {
    for (let j = 0; j < this.resources.length; j++) {
      if (request[j] > this.need[processIndex][j]) {
        return { success: false, reason: `Request exceeds maximum need for resource ${this.resources[j]}` };
      }
      if (request[j] > this.available[j]) {
        return { success: false, reason: `Insufficient ${this.resources[j]} available` };
      }
    }
    return { success: true };
  }

  // Safety Algorithm - checks if system is in safe state
  isSafeState() {
    const work = [...this.available];
    const finish = new Array(this.processes.length).fill(false);
    const safeSequence = [];
    const executionLog = [];

    let found = true;
    while (found && safeSequence.length < this.processes.length) {
      found = false;
      for (let i = 0; i < this.processes.length; i++) {
        if (!finish[i]) {
          let canExecute = true;
          for (let j = 0; j < this.resources.length; j++) {
            if (this.need[i][j] > work[j]) {
              canExecute = false;
              break;
            }
          }

          if (canExecute) {
            const beforeWork = [...work];
            // Process can complete, release its resources
            for (let j = 0; j < this.resources.length; j++) {
              work[j] += this.allocation[i][j];
            }
            finish[i] = true;
            safeSequence.push(this.processes[i]);
            executionLog.push({
              process: this.processes[i],
              need: [...this.need[i]],
              allocation: [...this.allocation[i]],
              workBefore: beforeWork,
              workAfter: [...work]
            });
            found = true;
            break;
          }
        }
      }
    }

    const isSafe = safeSequence.length === this.processes.length;
    return {
      safe: isSafe,
      safeSequence: isSafe ? safeSequence : [],
      executionLog,
      unfinishedProcesses: isSafe ? [] : this.processes.filter((_, i) => !finish[i])
    };
  }

  // Request resources for a process
  requestResources(processIndex, request) {
    const validation = this.canSatisfyRequest(processIndex, request);
    if (!validation.success) {
      return { granted: false, reason: validation.reason };
    }

    // Temporarily allocate resources
    const originalAvailable = [...this.available];
    const originalAllocation = this.allocation[processIndex].map(x => x);
    const originalNeed = this.need[processIndex].map(x => x);

    for (let j = 0; j < this.resources.length; j++) {
      this.available[j] -= request[j];
      this.allocation[processIndex][j] += request[j];
      this.need[processIndex][j] -= request[j];
    }

    // Check if resulting state is safe
    const safetyCheck = this.isSafeState();

    if (safetyCheck.safe) {
      return {
        granted: true,
        newState: {
          available: [...this.available],
          allocation: this.allocation.map(row => [...row]),
          need: this.need.map(row => [...row])
        },
        safetyCheck
      };
    } else {
      // Rollback
      this.available = originalAvailable;
      this.allocation[processIndex] = originalAllocation;
      this.need[processIndex] = originalNeed;
      return {
        granted: false,
        reason: 'Request would lead to unsafe state',
        safetyCheck
      };
    }
  }

  // Release resources from a process (when it completes)
  releaseResources(processIndex) {
    for (let j = 0; j < this.resources.length; j++) {
      this.available[j] += this.allocation[processIndex][j];
      this.allocation[processIndex][j] = 0;
      this.need[processIndex][j] = this.maxDemand[processIndex][j];
    }
    return {
      success: true,
      newAvailable: [...this.available]
    };
  }

  // Get current system state
  getState() {
    return {
      processes: this.processes,
      resources: this.resources,
      allocation: this.allocation.map(row => [...row]),
      maxDemand: this.maxDemand.map(row => [...row]),
      need: this.need.map(row => [...row]),
      available: [...this.available]
    };
  }

  // Calculate total allocated resources
  getTotalAllocated() {
    const total = new Array(this.resources.length).fill(0);
    for (let i = 0; i < this.processes.length; i++) {
      for (let j = 0; j < this.resources.length; j++) {
        total[j] += this.allocation[i][j];
      }
    }
    return total;
  }
}

module.exports = BankersEngine;
